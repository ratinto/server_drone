# GPS Trigger System Setup

## System Architecture

```
┌─────────────┐        ┌──────────────────┐        ┌────────────────┐
│  Pixhawk    │──MAVLink──│  Raspberry Pi   │──HTTP──│  Cloud Server  │
│  (Drone)    │        │  (GPS Logger)    │        │  (Vercel)      │
└─────────────┘        └──────────────────┘        └────────────────┘
                              ↑
                              │ HTTP
                              │
                         ┌────┴──────┐
                         │  Frontend │
                         │  (Button) │
                         └───────────┘
```

## How It Works

1. **Continuous Logging**: Raspberry Pi continuously reads GPS data from Pixhawk and stores in local buffer (last 1000 readings)
2. **Button Trigger**: User clicks button on frontend
3. **Coordinate Send**: Raspberry Pi API receives request and sends the GPS coordinate (with timestamp) to cloud server
4. **Database Storage**: Server stores coordinate in PostgreSQL database

## Raspberry Pi Setup

### 1. Install Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Python packages
pip3 install pymavlink flask flask-cors requests

# Or use requirements.txt
pip3 install -r requirements.txt
```

Create `requirements.txt`:
```
pymavlink==2.4.41
flask==3.0.0
flask-cors==4.0.0
requests==2.31.0
```

### 2. Connect Pixhawk to Raspberry Pi

- **USB Connection**: Connect Pixhawk to Raspberry Pi via USB (typically `/dev/ttyACM0`)
- **Serial Connection**: Or use GPIO serial pins (UART)

To find the connection port:
```bash
ls /dev/tty*
# Look for /dev/ttyACM0 or /dev/ttyUSB0
```

### 3. Test Pixhawk Connection

```python
from pymavlink import mavutil

connection = mavutil.mavlink_connection('/dev/ttyACM0', baud=57600)
connection.wait_heartbeat()
print("✓ Pixhawk connected!")
```

### 4. Start GPS Logger & API

```bash
# Make scripts executable
chmod +x raspi_api.py raspi_gps_logger.py

# Run the API (this starts GPS logging in background)
python3 raspi_api.py
```

The API will start on `http://<raspberry-pi-ip>:5000`

### 5. Find Raspberry Pi IP Address

```bash
hostname -I
# Example output: 192.168.1.100
```

## Frontend Setup

### 1. Update Raspberry Pi IP

Edit `frontend_trigger.html` line 149:
```javascript
const RASPI_IP = '192.168.1.100';  // Change to your Raspberry Pi's IP
```

### 2. Open Frontend

Simply open `frontend_trigger.html` in a web browser. Make sure you're on the same network as the Raspberry Pi.

## Server API Endpoints

### Raspberry Pi API (Local)
- `GET /` - Status check
- `GET /api/status` - Get GPS buffer status
- `POST /api/send-latest` - Send most recent GPS coordinate
- `POST /api/send-by-timestamp` - Send coordinate by specific timestamp

### Cloud Server (Vercel)
- `POST /api/coordinates` - Store coordinate in database
  ```json
  {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "altitude": 100.5,
    "timestamp": "2026-01-13T10:30:00.000Z"
  }
  ```

## Testing

### Test Raspberry Pi API
```bash
# Check status
curl http://192.168.1.100:5000/api/status

# Send latest coordinate
curl -X POST http://192.168.1.100:5000/api/send-latest
```

### Test Cloud Server
```bash
# Manually send coordinate
curl -X POST https://server-drone.vercel.app/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "altitude": 100.5,
    "timestamp": "2026-01-13T10:30:00.000Z"
  }'
```

### View All Coordinates
```bash
curl https://server-drone.vercel.app/api/coordinates
```

## Troubleshooting

### Pixhawk Not Connecting
- Check USB cable connection
- Verify port: `ls /dev/tty*`
- Try different baud rates: 57600, 115200
- Check permissions: `sudo chmod 666 /dev/ttyACM0`

### Cannot Connect from Frontend
- Verify Raspberry Pi IP address
- Check if Flask API is running
- Ensure both devices are on same network
- Check firewall settings

### GPS Data Not Available
- Wait for GPS lock (can take 1-2 minutes outdoors)
- Check if Pixhawk has GPS module connected
- Verify MAVLink messages are being received

## Running at Startup (Raspberry Pi)

### Create systemd service

Create `/etc/systemd/system/gps-logger.service`:
```ini
[Unit]
Description=Pixhawk GPS Logger API
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/drone
ExecStart=/usr/bin/python3 /home/pi/drone/raspi_api.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable gps-logger.service
sudo systemctl start gps-logger.service
sudo systemctl status gps-logger.service
```

## Data Flow Example

1. **Pixhawk GPS**: `(28.6139, 77.2090, 100.5m)` at `10:30:00`
2. **Raspberry Pi logs**: Stored in buffer with timestamp
3. **User clicks button** at `10:30:02`
4. **Raspberry Pi finds**: Closest reading from `10:30:00` (2 sec difference)
5. **Send to server**: 
   ```json
   {
     "latitude": 28.6139,
     "longitude": 77.2090,
     "altitude": 100.5,
     "timestamp": "2026-01-13T10:30:00.000Z"
   }
   ```
6. **Server stores** in database with ID
7. **Frontend shows**: Success message

## Security Considerations

- The Raspberry Pi API is **not secured** - use only on trusted networks
- For production, add:
  - API key authentication
  - HTTPS (use ngrok or similar)
  - Rate limiting
  - Input validation

## Performance

- **GPS Log Rate**: 10 Hz (10 readings/second)
- **Buffer Size**: 1000 readings (~100 seconds of data)
- **Network Latency**: Typically < 500ms
- **Timestamp Accuracy**: ±0.1 seconds

## Support

For issues or questions, check:
- Pixhawk documentation: https://docs.px4.io
- MAVLink protocol: https://mavlink.io
- Flask documentation: https://flask.palletsprojects.com
