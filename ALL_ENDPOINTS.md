# 🚁 Complete API Endpoints Reference

**Base URL:** `https://server-drone.vercel.app`

---

## 📍 Coordinates API (Detection & Delivery System)

### Create & Retrieve

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/coordinates` | Store detected person coordinates | `{ "latitude": Float, "longitude": Float }` |
| GET | `/api/coordinates` | Get all coordinates | Query params: `isVisited`, `isDelivered` |
| GET | `/api/coordinates/:id` | Get specific coordinate by ID | - |
| GET | `/api/coordinates/status/unvisited` | Get unvisited coordinates | - |
| GET | `/api/coordinates/status/pending` | Get pending deliveries | - |

### Update

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| PATCH | `/api/coordinates/:id/visited` | Mark coordinate as visited | - |
| PATCH | `/api/coordinates/:id/delivered` | Mark coordinate as delivered | - |

### Delete

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| DELETE | `/api/coordinates/:id` | Delete specific coordinate | - |

---

## 📊 Telemetry API (Pixhawk/Raspberry Pi Data)

### Create & Retrieve

| Method | Endpoint | Description | Request Body / Query Params |
|--------|----------|-------------|----------------------------|
| POST | `/api/telemetry` | Send telemetry data from Raspberry Pi | See telemetry data structure below |
| GET | `/api/telemetry` | Get all telemetry data | Query: `droneId`, `limit`, `startDate`, `endDate` |
| GET | `/api/telemetry/:id` | Get specific telemetry record by ID | - |
| GET | `/api/telemetry/latest` | Get latest telemetry for a drone | Query: `droneId` (required) |
| GET | `/api/telemetry/stats/:droneId` | Get statistics for a drone | Query: `hours` (default: 24) |

### Update

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| PUT | `/api/telemetry/:id` | Complete update of telemetry record | Full telemetry data |
| PATCH | `/api/telemetry/:id` | Partial update of telemetry record | Any telemetry fields to update |

### Delete

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| DELETE | `/api/telemetry/:id` | Delete specific telemetry record | - |
| DELETE | `/api/telemetry/cleanup` | Delete old telemetry data | Query: `days` (default: 30) |

---

## 📋 Data Structures

### Coordinates Request Body
```json
{
  "latitude": 37.7749,      // Required: Float
  "longitude": -122.4194    // Required: Float
}
```

### Coordinates Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "isVisited": false,
    "isDelivered": false,
    "createdAt": "2026-01-10T12:00:00.000Z",
    "updatedAt": "2026-01-10T12:00:00.000Z"
  }
}
```

### Telemetry Request Body (Complete)
```json
{
  "droneId": "drone_01",           // Optional: String
  "latitude": 37.7749,             // Required: Float
  "longitude": -122.4194,          // Required: Float
  "altitude": 100.5,               // Required: Float (meters)
  "heading": 45.5,                 // Optional: Float (degrees 0-360)
  "groundSpeed": 5.2,              // Optional: Float (m/s)
  "verticalSpeed": 0.5,            // Optional: Float (m/s)
  "batteryLevel": 85.5,            // Optional: Float (percentage 0-100)
  "voltage": 12.6,                 // Optional: Float (volts)
  "current": 15.3,                 // Optional: Float (amps)
  "gpsFixType": 3,                 // Optional: Integer (0=no fix, 2=2D, 3=3D)
  "satelliteCount": 12,            // Optional: Integer
  "flightMode": "GUIDED",          // Optional: String
  "armed": true,                   // Optional: Boolean
  "timestamp": "2026-01-10T12:00:00.000Z"  // Optional: DateTime
}
```

### Telemetry Response
```json
{
  "success": true,
  "message": "Telemetry data stored successfully",
  "data": {
    "id": 1,
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
    "armed": true,
    "timestamp": "2026-01-10T12:00:00.000Z",
    "createdAt": "2026-01-10T12:00:00.000Z"
  }
}
```

---

## 🔗 Quick Examples

### Coordinates API

#### Store Coordinates
```bash
curl -X POST https://server-drone.vercel.app/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'
```

#### Get Unvisited Coordinates
```bash
curl https://server-drone.vercel.app/api/coordinates/status/unvisited
```

#### Mark as Visited
```bash
curl -X PATCH https://server-drone.vercel.app/api/coordinates/1/visited
```

#### Mark as Delivered
```bash
curl -X PATCH https://server-drone.vercel.app/api/coordinates/1/delivered
```

### Telemetry API

#### Send Telemetry (Full)
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

#### Send Minimal Telemetry
```bash
curl -X POST https://server-drone.vercel.app/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 100.5
  }'
```

#### Get Latest Telemetry
```bash
curl https://server-drone.vercel.app/api/telemetry/latest?droneId=drone_01
```

#### Get All Telemetry for Drone
```bash
curl https://server-drone.vercel.app/api/telemetry?droneId=drone_01&limit=50
```

#### Get Telemetry Statistics
```bash
curl https://server-drone.vercel.app/api/telemetry/stats/drone_01?hours=24
```

#### Update Battery Level
```bash
curl -X PATCH https://server-drone.vercel.app/api/telemetry/1 \
  -H "Content-Type: application/json" \
  -d '{"batteryLevel": 75.5}'
```

#### Update Multiple Fields
```bash
curl -X PATCH https://server-drone.vercel.app/api/telemetry/1 \
  -H "Content-Type: application/json" \
  -d '{"altitude": 110.0, "groundSpeed": 6.0, "flightMode": "AUTO"}'
```

#### Delete Specific Telemetry
```bash
curl -X DELETE https://server-drone.vercel.app/api/telemetry/1
```

#### Cleanup Old Data
```bash
curl -X DELETE https://server-drone.vercel.app/api/telemetry/cleanup?days=7
```

---

## 📊 Query Parameters Reference

### `/api/coordinates`
- `isVisited` - Filter by visited status (`true` or `false`)
- `isDelivered` - Filter by delivery status (`true` or `false`)

### `/api/telemetry`
- `droneId` - Filter by drone ID
- `limit` - Maximum number of records to return (default: 100)
- `startDate` - Filter from this date (ISO 8601 format)
- `endDate` - Filter until this date (ISO 8601 format)

### `/api/telemetry/latest`
- `droneId` - **Required** - Drone ID to get latest telemetry for

### `/api/telemetry/stats/:droneId`
- `hours` - Time period in hours (default: 24)

### `/api/telemetry/cleanup`
- `days` - Delete data older than X days (default: 30)

---

## 🔢 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (missing required fields) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

---

## 🎯 Total Endpoints: 18

- **Coordinates API**: 8 endpoints
- **Telemetry API**: 10 endpoints

---

## 📚 Additional Documentation

- **[README.md](README.md)** - Complete project documentation
- **[API_TESTING.md](API_TESTING.md)** - Coordinates API testing examples
- **[TELEMETRY_API.md](TELEMETRY_API.md)** - Detailed telemetry API with code examples
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick lookup reference
- **[UPDATE_FEATURE.md](UPDATE_FEATURE.md)** - Update functionality guide
