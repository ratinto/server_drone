# Drone Delivery Server

A server application for managing drone detection and delivery coordinates. This system allows detection drones to store person coordinates and delivery drones to retrieve and deliver packages to those locations.

## 🌐 Live API
**Production URL:** https://server-drone.vercel.app/

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (for local development)

## Database Configuration

The application uses MySQL database (configured via DATABASE_URL environment variable).

## Getting Started (Local Development)

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env`:
```
DATABASE_URL="your-mysql-connection-string"
PORT=3000
NODE_ENV=development
```

3. Set up the database:
```bash
npm run prisma:migrate
```

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

5. Start the development server:
```bash
npm run dev
```

The local server will start on http://localhost:3000

## API Endpoints

### 📍 Coordinates Management

#### Store New Coordinates
**POST** `/api/coordinates`

Store coordinates when a detection drone finds a person.

```json
{
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

#### Get All Coordinates
**GET** `/api/coordinates`

Query parameters:
- `isVisited` (optional): Filter by visited status (true/false)
- `isDelivered` (optional): Filter by delivery status (true/false)

#### Get Single Coordinate
**GET** `/api/coordinates/:id`

#### Get Unvisited Coordinates
**GET** `/api/coordinates/status/unvisited`

Returns coordinates that haven't been visited yet (for delivery drones to pick up).

#### Get Pending Deliveries
**GET** `/api/coordinates/status/pending`

Returns coordinates that have been visited but not yet delivered.

#### Mark as Visited
**PATCH** `/api/coordinates/:id/visited`

Mark a coordinate as visited by a drone.

#### Mark as Delivered
**PATCH** `/api/coordinates/:id/delivered`

Mark a coordinate as delivered (automatically marks as visited too).

## Workflow

### Coordinates Workflow
1. **Detection Drone** detects a person → POST coordinates to `/api/coordinates`
2. **Delivery Drone** queries unvisited locations → GET `/api/coordinates/status/unvisited`
3. **Delivery Drone** arrives at location → PATCH `/api/coordinates/:id/visited`
4. **Delivery Drone** completes delivery → PATCH `/api/coordinates/:id/delivered`

### Telemetry Workflow
1. **Raspberry Pi** reads data from Pixhawk
2. **Raspberry Pi** sends telemetry → POST to `/api/telemetry`
3. **Ground Control** monitors drone → GET `/api/telemetry/latest?droneId=drone_01`
4. **Analytics** views statistics → GET `/api/telemetry/stats/drone_01`

## 📊 Telemetry Management

### Store Telemetry Data
**POST** `/api/telemetry`

Send telemetry data from Raspberry Pi/Pixhawk.

```json
{
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
}
```

### Get All Telemetry
**GET** `/api/telemetry`

Query parameters:
- `droneId` (optional): Filter by drone ID
- `limit` (optional): Number of records to return (default: 100)
- `startDate` (optional): Filter from this date
- `endDate` (optional): Filter until this date

### Get Latest Telemetry
**GET** `/api/telemetry/latest?droneId=drone_01`

Get the most recent telemetry data for a specific drone.

### Get Telemetry Statistics
**GET** `/api/telemetry/stats/:droneId`

Query parameters:
- `hours` (optional): Time period in hours (default: 24)

Returns statistics like average battery level, altitude, speed, etc.

### Get Single Telemetry
**GET** `/api/telemetry/:id`

### Cleanup Old Data
**DELETE** `/api/telemetry/cleanup`

Query parameters:
- `days` (optional): Delete data older than X days (default: 30)

## Scripts

- `npm run dev` - Start development server with watch mode
- `npm start` - Start production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:studio` - Open Prisma Studio (Database GUI)

## Database Schema

### Coordinates Model
```
- id: Integer (Primary Key)
- latitude: Float
- longitude: Float
- isVisited: Boolean (default: false)
- isDelivered: Boolean (default: false)
- createdAt: DateTime
- updatedAt: DateTime
```

### Telemetry Model
```
- id: Integer (Primary Key)
- droneId: String (optional)
- latitude: Float
- longitude: Float
- altitude: Float
- heading: Float (optional)
- groundSpeed: Float (optional)
- verticalSpeed: Float (optional)
- batteryLevel: Float (optional)
- voltage: Float (optional)
- current: Float (optional)
- gpsFixType: Integer (optional)
- satelliteCount: Integer (optional)
- flightMode: String (optional)
- armed: Boolean
- timestamp: DateTime
- createdAt: DateTime
```
