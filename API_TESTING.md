# API Testing Examples

## Test the Drone Delivery Server

**Production API:** https://server-drone.vercel.app/
**Local API:** http://localhost:3000/ (for development)

### 1. Store Coordinates (Detection Drone)
```bash
curl -X POST https://server-drone.vercel.app/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194
  }'
```

### 2. Get All Coordinates
```bash
curl https://server-drone.vercel.app/api/coordinates
```

### 3. Get Unvisited Coordinates (For Delivery Drone)
```bash
curl https://server-drone.vercel.app/api/coordinates/status/unvisited
```

### 4. Get Pending Deliveries
```bash
curl https://server-drone.vercel.app/api/coordinates/status/pending
```

### 5. Mark Coordinate as Visited
```bash
curl -X PATCH https://server-drone.vercel.app/api/coordinates/1/visited
```

### 6. Mark Coordinate as Delivered
```bash
curl -X PATCH https://server-drone.vercel.app/api/coordinates/1/delivered
```

### 7. Get Specific Coordinate
```bash
curl https://server-drone.vercel.app/api/coordinates/1
```

### 8. Filter Coordinates
```bash
# Get only visited coordinates
curl https://server-drone.vercel.app/api/coordinates?isVisited=true

# Get only delivered coordinates
curl https://server-drone.vercel.app/api/coordinates?isDelivered=true

# Get undelivered coordinates
curl https://server-drone.vercel.app/api/coordinates?isDelivered=false
```

## Example Workflow

### Step 1: Detection drone stores multiple coordinates
```bash
curl -X POST https://server-drone.vercel.app/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'

curl -X POST https://server-drone.vercel.app/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7849, "longitude": -122.4294}'

curl -X POST https://server-drone.vercel.app/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7949, "longitude": -122.4394}'
```

### Step 2: Delivery drone gets unvisited coordinates
```bash
curl https://server-drone.vercel.app/api/coordinates/status/unvisited
```

### Step 3: Delivery drone marks location as visited
```bash
curl -X PATCH https://server-drone.vercel.app/api/coordinates/1/visited
```

### Step 4: After delivery, mark as delivered
```bash
curl -X PATCH https://server-drone.vercel.app/api/coordinates/1/delivered
```
