# Raspberry Pi GPS Sender Setup Guide

Complete guide for setting up the GPS coordinate sender on Raspberry Pi connected to Pixhawk.

## 📋 Requirements

- Raspberry Pi (any model with USB)
- Pixhawk flight controller
- USB cable or serial connection
- Internet connection

## 🔧 Hardware Setup

### Option 1: USB Connection (Recommended)
```
Raspberry Pi USB Port <--USB Cable--> Pixhawk USB Port
```
- Device will appear as `/dev/ttyACM0` or `/dev/ttyUSB0`
- No additional configuration needed

### Option 2: GPIO Serial Connection
```
Raspberry Pi GPIO      Pixhawk TELEM Port
    TX (Pin 8)    -->      RX
    RX (Pin 10)   <--      TX
    GND (Pin 6)   ---      GND
```
- Device will be `/dev/serial0`
- Requires GPIO serial configuration

## 📦 Software Installation

### 1. Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Python Dependencies
```bash
sudo apt install -y python3 python3-pip python3-dev

# Install required packages
pip3 install dronekit requests pymavlink pyserial
```

### 3. Download GPS Sender Script
```bash
cd ~
# Copy raspi_gps_sender.py to Raspberry Pi
sudo cp raspi_gps_sender.py /usr/local/bin/
sudo chmod +x /usr/local/bin/raspi_gps_sender.py
```

### 4. Find Your Pixhawk Device
```bash
# List USB devices
ls -l /dev/tty*

# Common devices:
# /dev/ttyACM0  - Pixhawk via USB
# /dev/ttyUSB0  - USB-to-Serial adapter
# /dev/serial0  - GPIO serial pins
```

## 🧪 Testing

### Test Connection
```bash
python3 raspi_gps_sender.py \
  --connect /dev/ttyACM0 \
  --drone-id raspi_test_01 \
  --verbose
```

You should see:
```
✅ Successfully connected to Pixhawk
📡 Raspberry Pi GPS Sender Started
✅ Lat: -35.363262, Lon: 149.165238, Alt: 10.5m | Sent: 1, Failed: 0
```

### Test Different Devices
```bash
# If /dev/ttyACM0 doesn't work, try:
python3 raspi_gps_sender.py --connect /dev/ttyUSB0 --drone-id raspi_test_01 --verbose

# Or GPIO serial:
python3 raspi_gps_sender.py --connect /dev/serial0 --baud 57600 --drone-id raspi_test_01 --verbose
```

## 🚀 Run as Service (Auto-start on boot)

### 1. Create Systemd Service
```bash
sudo nano /etc/systemd/system/gps-sender.service
```

### 2. Add Service Configuration
```ini
[Unit]
Description=GPS Coordinate Sender for Pixhawk
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/bin/python3 /usr/local/bin/raspi_gps_sender.py --connect /dev/ttyACM0 --drone-id raspi_drone_01
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Important**: Change `--connect /dev/ttyACM0` to your actual device and `--drone-id` to your drone's ID.

### 3. Enable and Start Service
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (auto-start on boot)
sudo systemctl enable gps-sender

# Start service now
sudo systemctl start gps-sender

# Check status
sudo systemctl status gps-sender
```

### 4. Monitor Logs
```bash
# View live logs
sudo journalctl -u gps-sender -f

# View recent logs
sudo journalctl -u gps-sender -n 50

# View logs since boot
sudo journalctl -u gps-sender -b
```

### 5. Service Management Commands
```bash
# Stop service
sudo systemctl stop gps-sender

# Restart service
sudo systemctl restart gps-sender

# Disable auto-start
sudo systemctl disable gps-sender

# Check if running
sudo systemctl is-active gps-sender
```

## 🔧 Troubleshooting

### Permission Denied on /dev/ttyACM0
```bash
# Add user to dialout group
sudo usermod -a -G dialout pi

# Logout and login again, or reboot
sudo reboot
```

### Connection Timeout
1. Check Pixhawk is powered on
2. Verify USB cable is data-capable (not charge-only)
3. Try different USB port
4. Check dmesg for errors:
```bash
dmesg | grep tty
```

### Service Won't Start
```bash
# Check for errors
sudo journalctl -u gps-sender -xe

# Test script manually
sudo python3 /usr/local/bin/raspi_gps_sender.py --connect /dev/ttyACM0 --drone-id test --verbose
```

### No GPS Data
- Wait for GPS lock (can take 1-2 minutes outdoors)
- Check GPS satellite count in verbose mode
- Ensure Pixhawk antenna has clear sky view

## 📊 Monitoring

### Check if Data is Reaching Server
```bash
curl https://server-drone.vercel.app/api/logs | jq
```

### Real-time Statistics
The script shows statistics every 10 successful sends in non-verbose mode.

## 🎯 Production Configuration

For production use on your drone:

```bash
sudo nano /etc/systemd/system/gps-sender.service
```

Update with your drone ID:
```ini
ExecStart=/usr/bin/python3 /usr/local/bin/raspi_gps_sender.py \
  --connect /dev/ttyACM0 \
  --drone-id delivery_drone_01 \
  --interval 0.5
```

Then restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart gps-sender
```

## 📱 Frontend Button Integration

Once the GPS sender is running:
1. Open `frontend_trigger.html` in your browser
2. Click "📍 Capture & Send GPS"
3. The most recent GPS coordinate will be copied to the Coordinates database

The system works with a ±5 second time window, so the button will capture the GPS position at approximately the moment you click it.

## 🔋 Power Management

For battery-powered drones, the script is optimized for low power:
- Minimal CPU usage
- Efficient error handling
- Auto-reconnection on connection loss
- Graceful shutdown on power loss

## 📝 Notes

- Default send interval: 0.5 seconds (2 GPS updates per second)
- Script auto-reconnects if connection is lost
- All timestamps are in UTC
- GPS data includes: lat, lon, altitude, heading, speed

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs: `sudo journalctl -u gps-sender -n 100`
3. Test manually with `--verbose` flag
4. Verify network connectivity to backend

## 🔐 Security

For production deployment:
- Consider using HTTPS only
- Add API authentication if needed
- Restrict network access to necessary endpoints
- Keep system updated: `sudo apt update && sudo apt upgrade`
