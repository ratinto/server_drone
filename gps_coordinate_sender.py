#!/usr/bin/env python3
"""
Direct GPS Coordinate Sender to Backend API
============================================

This script continuously reads GPS coordinates from Pixhawk and sends them
directly to the backend API in real-time, similar to telemetry.

Usage:
    python3 gps_coordinate_sender.py --connect tcp:127.0.0.1:5760 --drone-id sim_drone_01
    
    For SITL: --connect tcp:127.0.0.1:5760
    For Real: --connect /dev/ttyACM0 --baud 57600

Press Ctrl+C to stop
"""

from dronekit import connect, VehicleMode
import time
import requests
import argparse
from datetime import datetime
import sys

# Configuration
API_URL = "https://server-drone.vercel.app/api/logs"
SEND_INTERVAL = 0.5  # Send coordinates every 1 second


class GPSCoordinateSender:
    """Sends GPS coordinates directly to backend API in real-time"""
    
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
        
    def connect_vehicle(self):
        """Connect to the vehicle"""
        print(f"🔗 Connecting to vehicle on {self.connection_string}...")
        try:
            if self.connection_string.startswith('udp:') or self.connection_string.startswith('tcp:'):
                self.vehicle = connect(self.connection_string, wait_ready=True)
            else:
                self.vehicle = connect(self.connection_string, baud=self.baud_rate, wait_ready=True)
            print("✅ Connected to vehicle")
            print(f"   Drone ID: {self.drone_id}")
            print(f"   Vehicle Type: {self.vehicle.version}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            return False
    
    def get_gps_data(self):
        """Get current GPS data from vehicle"""
        try:
            location = self.vehicle.location.global_relative_frame
            gps = self.vehicle.gps_0
            
            return {
                'timestamp': datetime.now().isoformat(),
                'latitude': location.lat if location.lat else 0.0,
                'longitude': location.lon if location.lon else 0.0,
                'altitude': location.alt if location.alt else 0.0,
                'heading': self.vehicle.heading if self.vehicle.heading else 0,
                'groundspeed': self.vehicle.groundspeed if self.vehicle.groundspeed else 0.0,
                'satellites': gps.satellites_visible if gps.satellites_visible else 0,
                'gps_fix_type': gps.fix_type if gps.fix_type else 0
            }
        except Exception as e:
            print(f"⚠️  Error reading GPS data: {e}")
            return None
    
    def send_coordinates(self, coordinate_data):
        """Send coordinates to backend API"""
        try:
            # Try multiple payload formats to match backend API
            # Format 1: Flat structure (current API expectation)
            payload = {
                'droneId': self.drone_id,
                'latitude': coordinate_data['latitude'],
                'longitude': coordinate_data['longitude'],
                'altitude': coordinate_data['altitude'],
                'timestamp': coordinate_data['timestamp'],
                'heading': coordinate_data.get('heading', 0),
                'groundspeed': coordinate_data.get('groundspeed', 0.0),
                'satellites': coordinate_data.get('satellites', 0),
                'gps_fix_type': coordinate_data.get('gps_fix_type', 0)
            }
            
            if self.verbose:
                print(f"\n📤 Sending payload: {payload}\n")
            
            response = requests.post(self.api_url, json=payload, timeout=5)
            
            if self.verbose:
                print(f"📥 Response: {response.status_code} - {response.text[:300]}\n")
            
            if response.status_code == 200 or response.status_code == 201:
                self.total_sent += 1
                return True, "Success"
            else:
                self.total_failed += 1
                # Try to get error message from response
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', error_data.get('message', response.text[:150]))
                    if 'details' in error_data:
                        error_msg += f" | {error_data['details'][:100]}"
                except:
                    error_msg = response.text[:150]
                return False, f"HTTP {response.status_code}: {error_msg}"
                
        except requests.exceptions.Timeout:
            self.total_failed += 1
            return False, "Timeout"
        except requests.exceptions.ConnectionError:
            self.total_failed += 1
            return False, "Connection Error"
        except Exception as e:
            self.total_failed += 1
            return False, str(e)
    
    def run(self):
        """Main loop - continuously send GPS coordinates"""
        if not self.connect_vehicle():
            return
        
        self.running = True
        
        print(f"\n{'='*70}")
        print(f"📡 GPS Coordinate Sender Started")
        print(f"{'='*70}")
        print(f"Backend API: {self.api_url}")
        print(f"Send Interval: {self.send_interval}s")
        print(f"Drone ID: {self.drone_id}")
        print(f"Press Ctrl+C to stop")
        print(f"{'='*70}\n")
        
        try:
            while self.running:
                # Get GPS data
                gps_data = self.get_gps_data()
                
                if gps_data:
                    # Send to backend
                    success, message = self.send_coordinates(gps_data)
                    
                    # Print status
                    status_icon = "✅" if success else "❌"
                    print(f"{status_icon} [{gps_data['timestamp']}] "
                          f"Lat: {gps_data['latitude']:.6f}, "
                          f"Lon: {gps_data['longitude']:.6f}, "
                          f"Alt: {gps_data['altitude']:.1f}m, "
                          f"Sats: {gps_data['satellites']} | "
                          f"Sent: {self.total_sent}, Failed: {self.total_failed} | "
                          f"{message}")
                
                # Wait for next interval
                time.sleep(self.send_interval)
                
        except KeyboardInterrupt:
            print("\n\n🛑 Shutting down...")
        except Exception as e:
            print(f"\n❌ Error in main loop: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        print(f"\n📊 Statistics:")
        print(f"   Total Sent: {self.total_sent}")
        print(f"   Total Failed: {self.total_failed}")
        print(f"   Success Rate: {(self.total_sent / (self.total_sent + self.total_failed) * 100) if (self.total_sent + self.total_failed) > 0 else 0:.1f}%")
        
        if self.vehicle:
            print("🔌 Closing vehicle connection...")
            self.vehicle.close()
        
        print("✅ Shutdown complete")


def main():
    parser = argparse.ArgumentParser(
        description='Direct GPS Coordinate Sender to Backend API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  SITL Simulation:
    python3 gps_coordinate_sender.py --connect tcp:127.0.0.1:5760 --drone-id sim_drone_01
    
  Real Hardware:
    python3 gps_coordinate_sender.py --connect /dev/ttyACM0 --baud 57600 --drone-id raspi_drone_01
    
  Custom settings:
    python3 gps_coordinate_sender.py --connect tcp:127.0.0.1:5760 --interval 2 --drone-id test_drone --api-url https://your-api.com/api/coordinates
        """
    )
    
    parser.add_argument('--connect', required=True,
                        help='Connection string (e.g., /dev/ttyACM0, tcp:127.0.0.1:5760)')
    parser.add_argument('--baud', type=int, default=57600,
                        help='Baud rate for serial connection (default: 57600)')
    parser.add_argument('--drone-id', required=True,
                        help='Drone identifier (e.g., raspi_drone_01)')
    parser.add_argument('--api-url', default='https://server-drone.vercel.app/api/logs',
                        help='Backend API URL (default: https://server-drone.vercel.app/api/logs)')
    parser.add_argument('--interval', type=float, default=1.0,
                        help='Send interval in seconds (default: 1.0)')
    parser.add_argument('--verbose', action='store_true',
                        help='Enable verbose output for debugging')
    
    args = parser.parse_args()
    
    # Create and run sender
    sender = GPSCoordinateSender(
        connection_string=args.connect,
        baud_rate=args.baud,
        drone_id=args.drone_id,
        api_url=args.api_url,
        send_interval=args.interval,
        verbose=args.verbose
    )
    
    sender.run()


if __name__ == "__main__":
    main()
