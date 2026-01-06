# API Testing Examples

## Test the Drone Delivery Server

### 1. Store Coordinates (Detection Drone)
```bash
curl -X POST http://localhost:3000/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194
  }'
```

### 2. Get All Coordinates
```bash
curl http://localhost:3000/api/coordinates
```

### 3. Get Unvisited Coordinates (For Delivery Drone)
```bash
curl http://localhost:3000/api/coordinates/status/unvisited
```

### 4. Get Pending Deliveries
```bash
curl http://localhost:3000/api/coordinates/status/pending
```

### 5. Mark Coordinate as Visited
```bash
curl -X PATCH http://localhost:3000/api/coordinates/1/visited
```

### 6. Mark Coordinate as Delivered
```bash
curl -X PATCH http://localhost:3000/api/coordinates/1/delivered
```

### 7. Get Specific Coordinate
```bash
curl http://localhost:3000/api/coordinates/1
```

### 8. Filter Coordinates
```bash
# Get only visited coordinates
curl http://localhost:3000/api/coordinates?isVisited=true

# Get only delivered coordinates
curl http://localhost:3000/api/coordinates?isDelivered=true

# Get undelivered coordinates
curl http://localhost:3000/api/coordinates?isDelivered=false
```

## Example Workflow

### Step 1: Detection drone stores multiple coordinates
```bash
curl -X POST http://localhost:3000/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'

curl -X POST http://localhost:3000/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7849, "longitude": -122.4294}'

curl -X POST http://localhost:3000/api/coordinates \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7949, "longitude": -122.4394}'
```

### Step 2: Delivery drone gets unvisited coordinates
```bash
curl http://localhost:3000/api/coordinates/status/unvisited
```

### Step 3: Delivery drone marks location as visited
```bash
curl -X PATCH http://localhost:3000/api/coordinates/1/visited
```

### Step 4: After delivery, mark as delivered
```bash
curl -X PATCH http://localhost:3000/api/coordinates/1/delivered
```
