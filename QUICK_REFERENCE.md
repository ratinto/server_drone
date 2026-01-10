# 🚁 Drone Server API - Quick Reference

## Base URL
**Production:** `https://server-drone.vercel.app`

---

## 📍 Coordinates API (Detection & Delivery)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coordinates` | Store detected person coordinates |
| GET | `/api/coordinates` | Get all coordinates |
| GET | `/api/coordinates/:id` | Get specific coordinate |
| GET | `/api/coordinates/status/unvisited` | Get unvisited coordinates |
| GET | `/api/coordinates/status/pending` | Get pending deliveries |
| PATCH | `/api/coordinates/:id/visited` | Mark as visited |
| PATCH | `/api/coordinates/:id/delivered` | Mark as delivered |

---

## 📊 Telemetry API (Pixhawk Data)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/telemetry` | Send telemetry data from Raspberry Pi |
| GET | `/api/telemetry` | Get all telemetry data |
| GET | `/api/telemetry/:id` | Get specific telemetry record |
| GET | `/api/telemetry/latest?droneId=X` | Get latest telemetry for drone |
| GET | `/api/telemetry/stats/:droneId` | Get statistics for drone |
| DELETE | `/api/telemetry/cleanup` | Cleanup old telemetry data |

---

## 📤 Quick Examples

### Send Telemetry (Raspberry Pi)
```bash
curl -X POST https://server-drone.vercel.app/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "droneId": "drone_01",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 100.5,
    "batteryLevel": 85.5,
    "flightMode": "GUIDED",
    "armed": true
  }'
```

### Get Latest Telemetry
```bash
curl https://server-drone.vercel.app/api/telemetry/latest?droneId=drone_01
```

### Store Person Coordinates
```bash
curl -X POST https://server-drone.vercel.app/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194
  }'
```

### Get Unvisited Locations
```bash
curl https://server-drone.vercel.app/api/coordinates/status/unvisited
```

---

## 📚 Documentation Files

- **[README.md](README.md)** - Complete project documentation
- **[API_TESTING.md](API_TESTING.md)** - Coordinates API testing examples
- **[TELEMETRY_API.md](TELEMETRY_API.md)** - Detailed telemetry API with Python/Node.js examples
