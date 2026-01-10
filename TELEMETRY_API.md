# Telemetry API Testing Examples

## Test the Telemetry Endpoints

**Production API:** https://server-drone.vercel.app/
**Local API:** http://localhost:3000/ (for development)

## 📤 Send Telemetry Data (Raspberry Pi → Server)

### 1. Send Complete Telemetry Data
```bash
curl -X POST https://server-drone.vercel.app/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "droneId": "drone_01",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 100.5,
    "heading": 45.5,
    "groundSpeed": 5.2,
    "verticalSpeed": 0.5,
    "batteryLevel": 85.5,
    "voltage": 12.6,
    "current": 15.3,
    "gpsFixType": 3,
    "satelliteCount": 12,
    "flightMode": "GUIDED",
    "armed": true
  }'
```

### 2. Send Minimal Telemetry Data (Required Fields Only)
```bash
curl -X POST https://server-drone.vercel.app/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 100.5
  }'
```

## 📥 Retrieve Telemetry Data

### 3. Get All Telemetry Data (Latest 100 records)
```bash
curl https://server-drone.vercel.app/api/telemetry
```

### 4. Get Telemetry for Specific Drone
```bash
curl https://server-drone.vercel.app/api/telemetry?droneId=drone_01
```

### 5. Get Latest Telemetry for a Drone
```bash
curl https://server-drone.vercel.app/api/telemetry/latest?droneId=drone_01
```

### 6. Get Telemetry with Limit
```bash
curl https://server-drone.vercel.app/api/telemetry?droneId=drone_01&limit=50
```

### 7. Get Telemetry by Date Range
```bash
curl "https://server-drone.vercel.app/api/telemetry?droneId=drone_01&startDate=2026-01-01&endDate=2026-01-10"
```

### 8. Get Specific Telemetry by ID
```bash
curl https://server-drone.vercel.app/api/telemetry/1
```

## ✏️ Update Telemetry Data

### 9. Update Complete Telemetry Record (PUT)
```bash
curl -X PUT https://server-drone.vercel.app/api/telemetry/1 \
  -H "Content-Type: application/json" \
  -d '{
    "droneId": "drone_01",
    "latitude": 37.7850,
    "longitude": -122.4195,
    "altitude": 105.0,
    "batteryLevel": 80.0,
    "flightMode": "AUTO",
    "armed": true
  }'
```

### 10. Partially Update Telemetry Record (PATCH)
```bash
# Update only battery level
curl -X PATCH https://server-drone.vercel.app/api/telemetry/1 \
  -H "Content-Type: application/json" \
  -d '{
    "batteryLevel": 75.5
  }'
```

```bash
# Update multiple fields
curl -X PATCH https://server-drone.vercel.app/api/telemetry/1 \
  -H "Content-Type: application/json" \
  -d '{
    "altitude": 110.5,
    "groundSpeed": 6.0,
    "flightMode": "GUIDED"
  }'
```

### 11. Delete Specific Telemetry Record
```bash
curl -X DELETE https://server-drone.vercel.app/api/telemetry/1
```

## 📊 Statistics and Analytics

### 12. Get Telemetry Statistics (Last 24 hours)
```bash
curl https://server-drone.vercel.app/api/telemetry/stats/drone_01
```

### 13. Get Statistics for Custom Time Period
```bash
# Last 48 hours
curl https://server-drone.vercel.app/api/telemetry/stats/drone_01?hours=48

# Last 7 days
curl https://server-drone.vercel.app/api/telemetry/stats/drone_01?hours=168
```

## 🧹 Data Cleanup

### 14. Delete Old Telemetry Data (30 days)
```bash
curl -X DELETE https://server-drone.vercel.app/api/telemetry/cleanup
```

### 15. Delete Data Older Than 7 Days
```bash
curl -X DELETE https://server-drone.vercel.app/api/telemetry/cleanup?days=7
```

---

## Python Example (Raspberry Pi)

### Simple Python Script to Send Telemetry

```python
import requests
import time
from dronekit import connect, VehicleMode

# Connect to Pixhawk
vehicle = connect('/dev/ttyAMA0', wait_ready=True, baud=57600)

API_URL = "https://server-drone.vercel.app/api/telemetry"
DRONE_ID = "drone_01"
current_telemetry_id = None

def send_telemetry():
    global current_telemetry_id
    try:
        telemetry_data = {
            "droneId": DRONE_ID,
            "latitude": vehicle.location.global_frame.lat,
            "longitude": vehicle.location.global_frame.lon,
            "altitude": vehicle.location.global_frame.alt,
            "heading": vehicle.heading,
            "groundSpeed": vehicle.groundspeed,
            "verticalSpeed": vehicle.velocity[2] if vehicle.velocity else None,
            "batteryLevel": vehicle.battery.level,
            "voltage": vehicle.battery.voltage,
            "current": vehicle.battery.current,
            "satelliteCount": vehicle.gps_0.satellites_visible,
            "gpsFixType": vehicle.gps_0.fix_type,
            "flightMode": str(vehicle.mode.name),
            "armed": vehicle.armed
        }
        
        response = requests.post(API_URL, json=telemetry_data, timeout=5)
        
        if response.status_code == 201:
            result = response.json()
            current_telemetry_id = result['data']['id']
            print(f"✓ Telemetry sent successfully (ID: {current_telemetry_id})")
        else:
            print(f"✗ Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"✗ Exception: {e}")

def update_telemetry(telemetry_id, updates):
    """Update specific fields of existing telemetry"""
    try:
        url = f"{API_URL}/{telemetry_id}"
        response = requests.patch(url, json=updates, timeout=5)
        
        if response.status_code == 200:
            print(f"✓ Telemetry {telemetry_id} updated successfully")
        else:
            print(f"✗ Update Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"✗ Update Exception: {e}")

# Send telemetry every 2 seconds
while True:
    send_telemetry()
    time.sleep(2)
    
    # Example: Update battery level after 10 seconds
    # if current_telemetry_id:
    #     update_telemetry(current_telemetry_id, {
    #         "batteryLevel": vehicle.battery.level
    #     })
```

---

## Node.js Example (Alternative)

```javascript
import axios from 'axios';

const API_URL = 'https://server-drone.vercel.app/api/telemetry';
const DRONE_ID = 'drone_01';

async function sendTelemetry(telemetryData) {
  try {
    const response = await axios.post(API_URL, {
      droneId: DRONE_ID,
      ...telemetryData
    });
    
    console.log('✓ Telemetry sent:', response.data);
  } catch (error) {
    console.error('✗ Error sending telemetry:', error.message);
  }
}

// Example usage
const telemetry = {
  latitude: 37.7749,
  longitude: -122.4194,
  altitude: 100.5,
  heading: 45.5,
  groundSpeed: 5.2,
  batteryLevel: 85.5,
  voltage: 12.6,
  flightMode: 'GUIDED',
  armed: true
};

sendTelemetry(telemetry);
```

---

## Example Workflow

### Step 1: Start sending telemetry from Raspberry Pi
The Raspberry Pi continuously sends telemetry data every 2 seconds.

### Step 2: Monitor latest telemetry from ground control
```bash
# Get real-time data
watch -n 1 'curl -s https://server-drone.vercel.app/api/telemetry/latest?droneId=drone_01'
```

### Step 3: View statistics
```bash
curl https://server-drone.vercel.app/api/telemetry/stats/drone_01?hours=1
```

### Step 4: View all recent telemetry
```bash
curl https://server-drone.vercel.app/api/telemetry?droneId=drone_01&limit=10
```
