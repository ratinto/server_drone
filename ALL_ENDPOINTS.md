# All API Endpoints - Drone Delivery Server

**Base URL:** `https://server-drone.vercel.app`

## 📍 Coordinates API (9 Endpoints)

### 1. Create Single Coordinate
- **Endpoint:** `POST /api/coordinates`
- **Description:** Add a new coordinate where a person was detected
- **Request Body:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "altitude": 100.5,
  "timestamp": "2026-01-13T10:30:00.000Z"
}
```
Note: Only `latitude` and `longitude` are required. `altitude` and `timestamp` are optional.

### 2. 🚀 Trigger Batch Upload (For Raspberry Pi)
- **Endpoint:** `POST /api/coordinates/trigger-upload`
- **Description:** Upload batch coordinates from Raspberry Pi GPS logger
- **Use Case:** When button is clicked, Raspi sends all GPS coordinates logged since last upload
- **Request Body:**
```json
{
  "coordinates": [
    {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "altitude": 100.5,
      "timestamp": "2026-01-13T10:30:00.000Z"
    },
    {
      "latitude": 28.6140,
      "longitude": 77.2091,
      "altitude": 101.2,
      "timestamp": "2026-01-13T10:30:05.000Z"
    }
  ]
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Batch coordinates uploaded successfully",
  "inserted": 2,
  "total_sent": 2
}
```

### 3. Get All Coordinates
- **Endpoint:** `GET /api/coordinates`
- **Description:** Retrieve all coordinates
- **Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [...]
}
```

### 4. Get Coordinate by ID
- **Endpoint:** `GET /api/coordinates/:id`
- **Description:** Get a specific coordinate by ID
- **Response:**
```json
{
  "success": true,
  "data": {...}
}
```

### 5. Get Unvisited Coordinates
- **Endpoint:** `GET /api/coordinates/status/unvisited`
- **Description:** Get all coordinates that haven't been visited yet
- **Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

### 6. Get Pending Coordinates
- **Endpoint:** `GET /api/coordinates/status/pending`
- **Description:** Get coordinates that are visited but not delivered
- **Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

### 7. Mark as Visited
- **Endpoint:** `PATCH /api/coordinates/:id/visited`
- **Description:** Mark a coordinate as visited by the drone
- **Response:**
```json
{
  "success": true,
  "message": "Coordinate marked as visited",
  "data": {
    "id": 1,
    "isVisited": true,
    ...
  }
}
```

### 8. Mark as Delivered
- **Endpoint:** `PATCH /api/coordinates/:id/delivered`
- **Description:** Mark a coordinate as delivered
- **Response:**
```json
{
  "success": true,
  "message": "Coordinate marked as delivered",
  "data": {
    "id": 1,
    "isDelivered": true,
    ...
  }
}
```

### 9. Delete Coordinate
**DELETE** `/api/coordinates/:id`

---

## 🔄 Raspberry Pi Workflow

### How It Works:
1. **GPS Logger** continuously saves coordinates to `gps_log.csv` on Raspberry Pi
2. **API Server** runs in background waiting for triggers
3. **Frontend Button Click** → POST to `/api/coordinates/trigger-upload`
4. **Batch Upload**: Reads all coordinates since last upload from CSV
5. **Database Storage**: Sends batch to server, saves timestamp to avoid duplicates

### Usage Example (Python on Raspberry Pi):
```python
import requests
import csv
from datetime import datetime

# Read coordinates from local CSV log
coordinates = []
with open('gps_log.csv', 'r') as f:
    # Read coordinates logged since last upload
    # (implement your logic to filter by timestamp)
    for line in f:
        lat, lng, alt, timestamp = line.strip().split(',')
        coordinates.append({
            "latitude": float(lat),
            "longitude": float(lng),
            "altitude": float(alt),
            "timestamp": timestamp
        })

# Send batch to server
response = requests.post(
    "https://server-drone.vercel.app/api/coordinates/trigger-upload",
    json={"coordinates": coordinates}
)
print(response.json())
```

## 🔄 How It Works:
1. **GPS Logger** continuously saves coordinates to local storage on Raspberry Pi
2. **Button Click** on frontend triggers POST to `/api/coordinates/trigger-upload`
3. **Batch Upload** sends all new coordinates since last upload
4. **Database** stores all coordinates with timestamps

### 4. Get All Coordinates
