#!/usr/bin/env python3
"""
Raspberry Pi GPS Coordinate Sender for Pixhawk
===============================================

Optimized for Raspberry Pi connected to Pixhawk via serial/USB.
Features:
- Auto-reconnection on connection loss
- Robust error handling
- Low resource usage
- Systemd service compatible
- Configurable for different hardware setups

Hardware Setup:
    Raspberry Pi <--USB/Serial--> Pixhawk
    
Common connections:
    - USB: /dev/ttyACM0 or /dev/ttyUSB0
    - Serial: /dev/serial0 (GPIO pins)

Usage:
    # Test connection
    python3 raspi_gps_sender.py --connect /dev/ttyACM0 --drone-id raspi_drone_01 --verbose
    
    # Production run
    python3 raspi_gps_sender.py --connect /dev/ttyACM0 --drone-id raspi_drone_01

Installation as Service:
    sudo cp raspi_gps_sender.py /usr/local/bin/
    sudo chmod +x /usr/local/bin/raspi_gps_sender.py
    # Then create systemd service (see bottom of file)
"""

from dronekit import connect, VehicleMode
import time
import requests
import argparse
from datetime import datetime
import sys
import os
import signal

# Configuration
API_URL = "https://server-drone.vercel.app/api/logs"
SEND_INTERVAL = 0.5  # Send every 0.5 seconds
MAX_RETRIES = 5  # Max connection retries before giving up
RETRY_DELAY = 5  # Seconds between retry attempts


class RaspiGPSSender:
    """Raspberry Pi GPS Coordinate Sender"""
    
    def __init__(self, connection_string, baud_rate, drone_id, api_url, send_interval, verbose=False):
        self.connection_string = connection_string
        self.baud_rate = baud_rate
        self.drone_id = drone_id
        self.api_url = api_url
        self.send_interval = send_interval
        self.verbose = verbose
        self.vehicle = None
        self.running = False
        self.total_sent = 0
        self.total_failed = 0
        self.connection_attempts = 0
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
    def signal_handler(self, sig, frame):
        """Handle shutdown signals"""
        print(f"\n🛑 Received signal {sig}, shutting down gracefully...")
        self.running = False
        
    def log(self, message, level="INFO"):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def check_serial_port(self):
        """Check if serial port exists and is accessible"""
        if not os.path.exists(self.connection_string):
            self.log(f"Serial port {self.connection_string} does not exist", "ERROR")
            self.log("Available serial ports:", "INFO")
            try:
                import serial.tools.list_ports
                ports = serial.tools.list_ports.comports()
                for port in ports:
                    self.log(f"  - {port.device}: {port.description}", "INFO")
            except:
                self.log("  (Could not list ports - install pyserial)", "WARNING")
            return False
        return True
        
    def connect_vehicle(self, retry=True):
        """Connect to Pixhawk with retry logic"""
        while self.connection_attempts < MAX_RETRIES or not retry:
            try:
                self.connection_attempts += 1
                self.log(f"Connecting to Pixhawk on {self.connection_string} (attempt {self.connection_attempts}/{MAX_RETRIES})...")
                
                # Check if port exists (for serial connections)
                if not self.connection_string.startswith(('tcp:', 'udp:')):
                    if not self.check_serial_port():
                        if not retry:
                            return False
                        time.sleep(RETRY_DELAY)
                        continue
                
                # Connect to vehicle
                self.vehicle = connect(
                    self.connection_string,
                    baud=self.baud_rate,
                    wait_ready=True,
                    timeout=30
                )
                
                self.log("✅ Successfully connected to Pixhawk", "SUCCESS")
                self.log(f"   Drone ID: {self.drone_id}", "INFO")
                self.log(f"   Autopilot: {self.vehicle.version}", "INFO")
                self.connection_attempts = 0  # Reset counter on success
                return True
                
            except Exception as e:
                self.log(f"❌ Connection failed: {e}", "ERROR")
                
                if not retry or self.connection_attempts >= MAX_RETRIES:
                    self.log("Max retries reached or retry disabled", "ERROR")
                    return False
                    
                self.log(f"Retrying in {RETRY_DELAY} seconds...", "WARNING")
                time.sleep(RETRY_DELAY)
        
        return False
    
    def get_gps_data(self):
        """Get current GPS data from Pixhawk"""
        try:
            # Check if vehicle is still connected
            if not self.vehicle:
                raise Exception("Vehicle not connected")
            
            location = self.vehicle.location.global_relative_frame
            gps = self.vehicle.gps_0
            
            # Validate GPS data
            if location.lat is None or location.lon is None:
                if self.verbose:
                    self.log("⚠️  GPS data not yet available", "WARNING")
                return None
            
            gps_data = {
                'latitude': float(location.lat),
                'longitude': float(location.lon),
                'altitude': float(location.alt) if location.alt else 0.0,
                'heading': float(self.vehicle.heading) if self.vehicle.heading else 0,
                'speed': float(self.vehicle.groundspeed) if self.vehicle.groundspeed else 0.0,
                'timestamp': datetime.utcnow().isoformat() + 'Z'  # UTC timestamp
            }
            
            # Add GPS quality info if verbose
            if self.verbose:
                gps_data['satellites'] = gps.satellites_visible if gps.satellites_visible else 0
                gps_data['gps_fix'] = gps.fix_type if gps.fix_type else 0
            
            return gps_data
            
        except Exception as e:
            self.log(f"⚠️  Error reading GPS: {e}", "WARNING")
            return None
    
    def send_to_api(self, gps_data):
        """Send GPS data to backend API"""
        try:
            payload = {
                'latitude': gps_data['latitude'],
                'longitude': gps_data['longitude'],
                'altitude': gps_data['altitude'],
                'heading': gps_data['heading'],
                'speed': gps_data['speed'],
                'timestamp': gps_data['timestamp']
            }
            
            if self.verbose:
                self.log(f"📤 Sending: {payload}", "DEBUG")
            
            response = requests.post(
                self.api_url,
                json=payload,
                timeout=10,
                headers={'User-Agent': f'RaspiGPSSender/{self.drone_id}'}
            )
            
            if response.status_code in [200, 201]:
                self.total_sent += 1
                return True, "OK"
            else:
                self.total_failed += 1
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f": {error_data.get('error', 'Unknown error')}"
                except:
                    pass
                return False, error_msg
                
        except requests.exceptions.Timeout:
            self.total_failed += 1
            return False, "Timeout"
        except requests.exceptions.ConnectionError:
            self.total_failed += 1
            return False, "Network Error"
        except Exception as e:
            self.total_failed += 1
            return False, str(e)[:50]
    
    def run(self):
        """Main loop"""
        # Connect to Pixhawk
        if not self.connect_vehicle():
            self.log("❌ Failed to connect to Pixhawk", "ERROR")
            return 1
        
        self.running = True
        
        self.log("="*70, "INFO")
        self.log("📡 Raspberry Pi GPS Sender Started", "INFO")
        self.log("="*70, "INFO")
        self.log(f"API Endpoint: {self.api_url}", "INFO")
        self.log(f"Send Interval: {self.send_interval}s", "INFO")
        self.log(f"Drone ID: {self.drone_id}", "INFO")
        self.log(f"Connection: {self.connection_string}", "INFO")
        self.log("="*70, "INFO")
        
        consecutive_failures = 0
        last_success_time = time.time()
        
        try:
            while self.running:
                # Get GPS data
                gps_data = self.get_gps_data()
                
                if gps_data:
                    # Send to API
                    success, message = self.send_to_api(gps_data)
                    
                    if success:
                        consecutive_failures = 0
                        last_success_time = time.time()
                        
                        # Print status (less verbose for production)
                        if self.verbose or self.total_sent % 10 == 0:
                            self.log(
                                f"✅ Lat: {gps_data['latitude']:.6f}, "
                                f"Lon: {gps_data['longitude']:.6f}, "
                                f"Alt: {gps_data['altitude']:.1f}m | "
                                f"Sent: {self.total_sent}, Failed: {self.total_failed}",
                                "SUCCESS"
                            )
                    else:
                        consecutive_failures += 1
                        self.log(f"❌ Send failed: {message} (failures: {consecutive_failures})", "WARNING")
                        
                        # If too many consecutive failures, try to reconnect
                        if consecutive_failures >= 10:
                            self.log("Too many failures, attempting to reconnect...", "WARNING")
                            if self.vehicle:
                                try:
                                    self.vehicle.close()
                                except:
                                    pass
                            self.vehicle = None
                            if not self.connect_vehicle():
                                self.log("Reconnection failed, exiting", "ERROR")
                                break
                            consecutive_failures = 0
                
                # Check if vehicle disconnected
                if time.time() - last_success_time > 60:
                    self.log("⚠️  No successful sends in 60 seconds, checking connection...", "WARNING")
                    try:
                        # Try to read something from vehicle to check connection
                        _ = self.vehicle.location
                        last_success_time = time.time()
                    except:
                        self.log("Vehicle disconnected, attempting reconnect...", "ERROR")
                        if self.vehicle:
                            try:
                                self.vehicle.close()
                            except:
                                pass
                        self.vehicle = None
                        if not self.connect_vehicle():
                            break
                
                # Sleep
                time.sleep(self.send_interval)
                
        except KeyboardInterrupt:
            self.log("Received keyboard interrupt", "INFO")
        except Exception as e:
            self.log(f"Unexpected error: {e}", "ERROR")
        finally:
            self.cleanup()
        
        return 0
    
    def cleanup(self):
        """Clean up resources"""
        self.log("🧹 Cleaning up...", "INFO")
        self.log(f"📊 Final Statistics:", "INFO")
        self.log(f"   Total Sent: {self.total_sent}", "INFO")
        self.log(f"   Total Failed: {self.total_failed}", "INFO")
        
        if self.total_sent + self.total_failed > 0:
            success_rate = (self.total_sent / (self.total_sent + self.total_failed) * 100)
            self.log(f"   Success Rate: {success_rate:.1f}%", "INFO")
        
        if self.vehicle:
            try:
                self.log("Closing vehicle connection...", "INFO")
                self.vehicle.close()
            except Exception as e:
                self.log(f"Error closing vehicle: {e}", "WARNING")
        
        self.log("✅ Shutdown complete", "SUCCESS")


def auto_detect_device():
    """Auto-detect Pixhawk device"""
    # Common Pixhawk device paths
    possible_devices = [
        '/dev/ttyACM0',
        '/dev/ttyACM1',
        '/dev/ttyUSB0',
        '/dev/ttyUSB1',
        'tcp:127.0.0.1:5760',  # SITL default
        '/dev/serial0'
    ]
    
    for device in possible_devices:
        if device.startswith('tcp:'):
            return device  # Always try TCP if nothing else found
        if os.path.exists(device):
            return device
    
    # Default to TCP SITL if nothing found
    return 'tcp:127.0.0.1:5760'


def main():
    parser = argparse.ArgumentParser(
        description='Raspberry Pi GPS Sender for Pixhawk - Just run it!',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Quick Start:
  python3 raspi_gps_sender.py                    # Auto-detect device and run
  python3 raspi_gps_sender.py --verbose          # Run with debug output

Advanced Usage:
  python3 raspi_gps_sender.py --connect /dev/ttyACM0 --drone-id my_drone
  python3 raspi_gps_sender.py --connect tcp:127.0.0.1:5760  # For SITL simulation

The script will automatically:
  - Detect Pixhawk device (/dev/ttyACM0, /dev/ttyUSB0, or SITL)
  - Generate a drone ID based on hostname
  - Connect to https://server-drone.vercel.app/api/logs
  - Send GPS data every 0.5 seconds
        """
    )
    
    parser.add_argument('--connect', 
                        help='Connection string (default: auto-detect)')
    parser.add_argument('--baud', type=int, default=57600,
                        help='Baud rate for serial (default: 57600)')
    parser.add_argument('--drone-id',
                        help='Drone identifier (default: hostname)')
    parser.add_argument('--api-url', default='https://server-drone.vercel.app/api/logs',
                        help='Backend API URL')
    parser.add_argument('--interval', type=float, default=0.5,
                        help='Send interval in seconds (default: 0.5)')
    parser.add_argument('--verbose', action='store_true',
                        help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Auto-detect connection if not specified
    if not args.connect:
        args.connect = auto_detect_device()
        print(f"🔍 Auto-detected device: {args.connect}")
    
    # Auto-generate drone ID if not specified
    if not args.drone_id:
        import socket
        hostname = socket.gethostname()
        args.drone_id = f"drone_{hostname}".replace('.', '_').replace(' ', '_')
        print(f"🏷️  Auto-generated Drone ID: {args.drone_id}")
    
    # Create and run sender
    sender = RaspiGPSSender(
        connection_string=args.connect,
        baud_rate=args.baud,
        drone_id=args.drone_id,
        api_url=args.api_url,
        send_interval=args.interval,
        verbose=args.verbose
    )
    
    exit_code = sender.run()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
