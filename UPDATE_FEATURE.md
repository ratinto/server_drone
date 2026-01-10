# ✅ Telemetry Update Feature Added!

## What's New

I've added **UPDATE** functionality to the telemetry API, allowing you to modify existing telemetry records.

---

## 🆕 New Endpoints

### 1. **PUT `/api/telemetry/:id`** - Complete Update
Updates all fields of a telemetry record.

```bash
curl -X PUT https://server-drone.vercel.app/api/telemetry/1 \
  -H "Content-Type: application/json" \
  -d '{
    "droneId": "drone_01",
    "latitude": 37.7850,
    "longitude": -122.4195,
    "altitude": 105.0,
    "batteryLevel": 80.0,
    "flightMode": "AUTO"
  }'
```

### 2. **PATCH `/api/telemetry/:id`** - Partial Update
Updates only specific fields - perfect for updating just battery level, altitude, or flight mode.

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

### 3. **DELETE `/api/telemetry/:id`** - Delete Specific Record
Delete a specific telemetry record by ID.

```bash
curl -X DELETE https://server-drone.vercel.app/api/telemetry/1
```

---

## 🐍 Python Usage Example

```python
import requests

API_URL = "https://server-drone.vercel.app/api/telemetry"

# Update battery level of telemetry record #5
def update_battery(telemetry_id, battery_level):
    url = f"{API_URL}/{telemetry_id}"
    data = {"batteryLevel": battery_level}
    
    response = requests.patch(url, json=data)
    
    if response.status_code == 200:
        print(f"✓ Battery updated to {battery_level}%")
    else:
        print(f"✗ Error: {response.text}")

# Usage
update_battery(5, 72.5)
```

### Full Update Example
```python
def full_update_telemetry(telemetry_id, data):
    url = f"{API_URL}/{telemetry_id}"
    response = requests.put(url, json=data)
    
    if response.status_code == 200:
        print("✓ Telemetry fully updated")
        return response.json()
    else:
        print(f"✗ Error: {response.text}")
        return None

# Update complete record
full_update_telemetry(5, {
    "droneId": "drone_01",
    "latitude": 37.7850,
    "longitude": -122.4195,
    "altitude": 105.0,
    "batteryLevel": 80.0,
    "voltage": 12.5,
    "flightMode": "AUTO",
    "armed": True
})
```

---

## 📋 Use Cases

### 1. **Battery Monitoring**
Update only battery data without resending all telemetry:
```bash
curl -X PATCH https://server-drone.vercel.app/api/telemetry/123 \
  -H "Content-Type: application/json" \
  -d '{"batteryLevel": 68.5, "voltage": 11.8}'
```

### 2. **Flight Mode Changes**
Track flight mode transitions:
```bash
curl -X PATCH https://server-drone.vercel.app/api/telemetry/123 \
  -H "Content-Type: application/json" \
  -d '{"flightMode": "RTL"}'
```

### 3. **Position Corrections**
Correct GPS coordinates if needed:
```bash
curl -X PATCH https://server-drone.vercel.app/api/telemetry/123 \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'
```

### 4. **Data Cleanup**
Delete specific incorrect or test records:
```bash
curl -X DELETE https://server-drone.vercel.app/api/telemetry/999
```

---

## 🔄 Updated Features

✅ **PUT `/api/telemetry/:id`** - Complete record update  
✅ **PATCH `/api/telemetry/:id`** - Partial field update  
✅ **DELETE `/api/telemetry/:id`** - Delete specific record  
✅ Error handling for missing records (404)  
✅ Input validation and type conversion  
✅ Success/error response messages  

---

## 📚 Updated Documentation

All documentation has been updated:
- ✅ **README.md** - Updated with update endpoints
- ✅ **TELEMETRY_API.md** - Added update examples with curl and Python
- ✅ **QUICK_REFERENCE.md** - Added update endpoints to the table

---

## 🚀 Ready to Use!

The telemetry API now supports full CRUD operations:
- ✅ **C**reate - POST `/api/telemetry`
- ✅ **R**ead - GET `/api/telemetry`, GET `/api/telemetry/:id`
- ✅ **U**pdate - PUT/PATCH `/api/telemetry/:id`
- ✅ **D**elete - DELETE `/api/telemetry/:id`

Your Raspberry Pi can now not only send telemetry but also update existing records as needed! 🎉
