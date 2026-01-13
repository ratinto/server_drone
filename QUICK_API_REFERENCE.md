# API Quick Reference

**Base URL:** `https://server-drone.vercel.app`

## 🎯 Two APIs Available

### 1️⃣ Coordinates API - `/api/coordinates`
**Purpose:** Delivery locations with visit/delivery tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coordinates` | Create delivery coordinate |
| POST | `/api/coordinates/trigger-upload` | Batch upload from CSV |
| GET | `/api/coordinates` | Get all coordinates |
| GET | `/api/coordinates/status/unvisited` | Get unvisited |
| GET | `/api/coordinates/status/pending` | Get pending delivery |
| PATCH | `/api/coordinates/:id/visited` | Mark visited |
| PATCH | `/api/coordinates/:id/delivered` | Mark delivered |
| DELETE | `/api/coordinates/:id` | Delete coordinate |

### 2️⃣ Coordinate Logs API - `/api/logs`
**Purpose:** Continuous GPS logging from Pixhawk

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/logs` | Create single log |
| POST | `/api/logs/batch` | Batch upload logs |
| GET | `/api/logs` | Get all logs (paginated) |
| GET | `/api/logs/range` | Get logs by time range |
| GET | `/api/logs/latest` | Get latest log |
| GET | `/api/logs/:id` | Get log by ID |
| GET | `/api/logs/stats/summary` | Get statistics |
| DELETE | `/api/logs/:id` | Delete log |
| DELETE | `/api/logs` | Delete all logs |

---

## 🚀 Quick Examples

### Upload Coordinate (Delivery Location)
```python
import requests
requests.post("https://server-drone.vercel.app/api/coordinates", 
              json={"latitude": 28.6139, "longitude": 77.2090})
```

### Upload GPS Log (Continuous Tracking)
```python
import requests
requests.post("https://server-drone.vercel.app/api/logs", 
              json={
                  "latitude": 28.6139, 
                  "longitude": 77.2090,
                  "altitude": 150.5,
                  "heading": 45.0,
                  "speed": 12.5,
                  "timestamp": "2026-01-13T10:30:00Z"
              })
```

### Batch Upload Logs
```python
import requests
logs = [
    {"latitude": 28.6139, "longitude": 77.2090, "timestamp": "2026-01-13T10:30:00Z"},
    {"latitude": 28.6140, "longitude": 77.2091, "timestamp": "2026-01-13T10:30:01Z"}
]
requests.post("https://server-drone.vercel.app/api/logs/batch", json={"logs": logs})
```

### Get Latest GPS Log
```python
import requests
response = requests.get("https://server-drone.vercel.app/api/logs/latest")
print(response.json())
```

---

## 📊 Key Differences

| Feature | Coordinates | Coordinate Logs |
|---------|------------|----------------|
| **Purpose** | Delivery tracking | Continuous GPS logging |
| **Fields** | lat, lng, isVisited, isDelivered | lat, lng, altitude, heading, speed |
| **Use Case** | Detection → Delivery workflow | Flight path recording |
| **Batch Upload** | ✅ Via trigger-upload | ✅ Via /batch endpoint |
| **Time Range Query** | ❌ | ✅ |
| **Statistics** | ❌ | ✅ |

---

## 📖 Full Documentation

- **Coordinates API**: See `README.md`
- **Coordinate Logs API**: See `COORDINATE_LOGS_API.md`
