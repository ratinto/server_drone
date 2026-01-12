# Drone Delivery Server 🚁

A server application for managing drone detection and delivery coordinates with GPS logging support from Raspberry Pi + Pixhawk.

## 🌐 Live API
**Production URL:** https://server-drone.vercel.app/

## Features
- ✅ Single coordinate creation
- ✅ **Batch upload from Raspberry Pi GPS logger**
- ✅ Unvisited/Pending coordinates tracking
- ✅ Visit and delivery status management
- ✅ Timestamp and altitude support

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL Database

## Getting Started (Local Development)

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
DATABASE_URL="your-postgresql-connection-string"
PORT=3000
NODE_ENV=development
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### 📍 Coordinates Management

#### 1. Create Single Coordinate
**POST** `/api/coordinates`
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "altitude": 100.5,
  "timestamp": "2026-01-13T10:30:00.000Z"
}
```

#### 2. 🚀 Trigger Batch Upload (Raspberry Pi)
**POST** `/api/coordinates/trigger-upload`
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

#### 3. Get All Coordinates
**GET** `/api/coordinates`

#### 4. Get Unvisited Coordinates
**GET** `/api/coordinates/status/unvisited`

#### 5. Get Pending Coordinates (Visited but not Delivered)
**GET** `/api/coordinates/status/pending`

#### 6. Mark Coordinate as Visited
**PATCH** `/api/coordinates/:id/visited`

#### 7. Mark Coordinate as Delivered
**PATCH** `/api/coordinates/:id/delivered`

#### 8. Get Coordinate by ID
**GET** `/api/coordinates/:id`

#### 9. Delete Coordinate
**DELETE** `/api/coordinates/:id`

## 🔄 Raspberry Pi Workflow

### How It Works:
1. **GPS Logger** on Raspberry Pi continuously logs coordinates from Pixhawk to local CSV
2. **Frontend Button** triggers POST to `/api/coordinates/trigger-upload`
3. **Batch Upload** sends all coordinates since last upload timestamp
4. **Database** stores all coordinates with proper timestamps

### Python Example (Raspberry Pi):
```python
import requests

# Your Raspi reads from gps_log.csv and prepares coordinates
coordinates = [
    {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "altitude": 100.5,
        "timestamp": "2026-01-13T10:30:00.000Z"
    }
]

# Send batch to server
response = requests.post(
    "https://server-drone.vercel.app/api/coordinates/trigger-upload",
    json={"coordinates": coordinates}
)
print(response.json())
```

## Database Schema

```prisma
model Coordinates {
  id          Int       @id @default(autoincrement())
  latitude    Float
  longitude   Float
  altitude    Float?
  timestamp   DateTime?
  isVisited   Boolean   @default(false)
  isDelivered Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## Project Structure

```
server_drone/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── src/
│   ├── config/
│   │   └── database.js    # Prisma client
│   ├── routes/
│   │   └── coordinates.js # API routes (includes /trigger-upload)
│   └── index.js           # Main server
├── .env                   # Environment variables
└── vercel.json           # Deployment config
```

## Deployment

Deployed on Vercel using serverless functions.

1. Push to GitHub
2. Vercel auto-deploys
3. Set `DATABASE_URL` in Vercel environment variables

## License

MIT
