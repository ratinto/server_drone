# Coordinate Logs API Documentation

**Base URL:** `https://server-drone.vercel.app`

The Coordinate Logs API stores continuous GPS data from your Raspberry Pi connected to Pixhawk. This is separate from the main Coordinates API which stores specific delivery locations.

## 📊 CoordinateLogs Model

```prisma
model CoordinateLogs {
  id          Int      @id @default(autoincrement())
  latitude    Float
  longitude   Float
  altitude    Float?   // Optional altitude from Pixhawk
  heading     Float?   // Heading in degrees
  speed       Float?   // Speed in m/s
  timestamp   DateTime // Actual timestamp from Pixhawk GPS log
  createdAt   DateTime @default(now())
}
```

## 🔌 API Endpoints (9 total)

### 1. Create Single Log Entry
**POST** `/api/logs`

Store a single GPS coordinate log.

**Request Body:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "altitude": 150.5,
  "heading": 45.0,
  "speed": 12.5,
  "timestamp": "2026-01-13T10:30:00.000Z"
}
```

**Response:**
```json
{
  "message": "Coordinate log created successfully",
  "log": {
    "id": 1,
    "latitude": 28.6139,
    "longitude": 77.2090,
    "altitude": 150.5,
    "heading": 45.0,
    "speed": 12.5,
    "timestamp": "2026-01-13T10:30:00.000Z",
    "createdAt": "2026-01-13T10:30:05.000Z"
  }
}
```

---

### 2. Batch Upload Logs
**POST** `/api/logs/batch`

Upload multiple GPS logs at once. Perfect for bulk upload from CSV.

**Request Body:**
```json
{
  "logs": [
    {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "altitude": 150.5,
      "heading": 45.0,
      "speed": 12.5,
      "timestamp": "2026-01-13T10:30:00.000Z"
    },
    {
      "latitude": 28.6140,
      "longitude": 77.2091,
      "altitude": 151.0,
      "heading": 46.0,
      "speed": 13.0,
      "timestamp": "2026-01-13T10:30:01.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Coordinate logs uploaded successfully",
  "count": 2
}
```

---

### 3. Get All Logs (with pagination)
**GET** `/api/logs?limit=100&offset=0`

Retrieve all coordinate logs (newest first).

**Query Parameters:**
- `limit` (optional): Number of logs to return
- `offset` (optional): Number of logs to skip

**Response:**
```json
{
  "message": "Coordinate logs retrieved successfully",
  "count": 100,
  "total": 5432,
  "logs": [...]
}
```

---

### 4. Get Logs by Time Range
**GET** `/api/logs/range?startTime=<ISO>&endTime=<ISO>`

Get logs within a specific time period.

**Example:**
```
GET /api/logs/range?startTime=2026-01-13T10:00:00Z&endTime=2026-01-13T11:00:00Z
```

**Response:**
```json
{
  "message": "Coordinate logs retrieved successfully",
  "count": 250,
  "logs": [...]
}
```

---

### 5. Get Latest Log
**GET** `/api/logs/latest`

Get the most recent coordinate log.

**Response:**
```json
{
  "message": "Latest coordinate log retrieved successfully",
  "log": {
    "id": 5432,
    "latitude": 28.6150,
    "longitude": 77.2100,
    "altitude": 155.0,
    "heading": 90.0,
    "speed": 15.0,
    "timestamp": "2026-01-13T12:00:00.000Z",
    "createdAt": "2026-01-13T12:00:05.000Z"
  }
}
```

---

### 6. Get Log by ID
**GET** `/api/logs/:id`

Retrieve a specific log entry by ID.

**Response:**
```json
{
  "message": "Coordinate log retrieved successfully",
  "log": {...}
}
```

---

### 7. Get Statistics
**GET** `/api/logs/stats/summary`

Get summary statistics about your logs.

**Response:**
```json
{
  "message": "Coordinate logs statistics retrieved successfully",
  "stats": {
    "totalLogs": 5432,
    "oldestLog": "2026-01-10T08:00:00.000Z",
    "newestLog": "2026-01-13T12:00:00.000Z"
  }
}
```

---

### 8. Delete Log by ID
**DELETE** `/api/logs/:id`

Delete a specific log entry.

**Response:**
```json
{
  "message": "Coordinate log deleted successfully"
}
```

---

### 9. Delete All Logs (Cleanup)
**DELETE** `/api/logs`

⚠️ **Warning:** This deletes ALL coordinate logs!

**Response:**
```json
{
  "message": "All coordinate logs deleted successfully",
  "count": 5432
}
```

---

## 🐍 Python Examples for Raspberry Pi

### Single Log Upload
```python
import requests
import datetime

url = "https://server-drone.vercel.app/api/logs"

log_data = {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "altitude": 150.5,
    "heading": 45.0,
    "speed": 12.5,
    "timestamp": datetime.datetime.now().isoformat()
}

response = requests.post(url, json=log_data)
print(response.json())
```

### Batch Upload from CSV
```python
import requests
import csv
from datetime import datetime

# Read from CSV
logs = []
with open('gps_log.csv', 'r') as file:
    reader = csv.DictReader(file)
    for row in reader:
        logs.append({
            "latitude": float(row['latitude']),
            "longitude": float(row['longitude']),
            "altitude": float(row['altitude']) if row.get('altitude') else None,
            "heading": float(row['heading']) if row.get('heading') else None,
            "speed": float(row['speed']) if row.get('speed') else None,
            "timestamp": row['timestamp']
        })

# Upload batch
url = "https://server-drone.vercel.app/api/logs/batch"
response = requests.post(url, json={"logs": logs})
print(f"Uploaded {response.json()['count']} logs")
```

### Get Logs from Last Hour
```python
import requests
from datetime import datetime, timedelta

end_time = datetime.now()
start_time = end_time - timedelta(hours=1)

url = f"https://server-drone.vercel.app/api/logs/range"
params = {
    "startTime": start_time.isoformat(),
    "endTime": end_time.isoformat()
}

response = requests.get(url, params=params)
logs = response.json()
print(f"Found {logs['count']} logs in the last hour")
```

---

## 🔄 Complete Workflow

### On Raspberry Pi:

1. **Continuous Logging**: GPS data from Pixhawk is logged to `gps_log.csv`
2. **Trigger Upload**: When button is pressed (via API or GPIO)
3. **Batch Upload**: Read CSV and POST to `/api/logs/batch`
4. **Verification**: Check `/api/logs/stats/summary` to confirm

### Example Flask Server on Raspi:
```python
from flask import Flask, jsonify
import requests
import csv

app = Flask(__name__)
SERVER_URL = "https://server-drone.vercel.app"

@app.route('/trigger-upload', methods=['POST'])
def trigger_upload():
    # Read all logs from CSV
    logs = []
    with open('gps_log.csv', 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            logs.append({
                "latitude": float(row['latitude']),
                "longitude": float(row['longitude']),
                "altitude": float(row.get('altitude', 0)),
                "heading": float(row.get('heading', 0)),
                "speed": float(row.get('speed', 0)),
                "timestamp": row['timestamp']
            })
    
    # Upload to server
    response = requests.post(
        f"{SERVER_URL}/api/logs/batch",
        json={"logs": logs}
    )
    
    return jsonify({
        "message": "Upload complete",
        "uploaded": response.json()['count']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

---

## 📝 Notes

- **Timestamps**: Always use ISO 8601 format (e.g., `2026-01-13T10:30:00.000Z`)
- **Optional Fields**: `altitude`, `heading`, and `speed` can be `null`
- **Batch Uploads**: Recommended for efficient bulk data transfer
- **Pagination**: Use `limit` and `offset` when fetching large datasets
- **Cleanup**: Use DELETE endpoints carefully in production!

---

## 🔗 Related APIs

- **Coordinates API** (`/api/coordinates`): For delivery locations with visit/delivery tracking
- **Coordinate Logs API** (`/api/logs`): For continuous GPS logging (this API)
