import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// POST - Store telemetry data from Raspberry Pi/Pixhawk
router.post('/', async (req, res) => {
  try {
    const {
      droneId,
      latitude,
      longitude,
      altitude,
      heading,
      groundSpeed,
      verticalSpeed,
      batteryLevel,
      voltage,
      current,
      gpsFixType,
      satelliteCount,
      flightMode,
      armed,
      timestamp
    } = req.body;
    
    // Validate required fields
    if (latitude === undefined || longitude === undefined || altitude === undefined) {
      return res.status(400).json({ 
        error: 'Latitude, longitude, and altitude are required',
        example: {
          droneId: "drone_01",
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: 100.5,
          heading: 45.5,
          groundSpeed: 5.2,
          verticalSpeed: 0.5,
          batteryLevel: 85.5,
          voltage: 12.6,
          current: 15.3,
          gpsFixType: 3,
          satelliteCount: 12,
          flightMode: "GUIDED",
          armed: true
        }
      });
    }
    
    const telemetry = await prisma.telemetry.create({
      data: {
        droneId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        altitude: parseFloat(altitude),
        heading: heading !== undefined ? parseFloat(heading) : null,
        groundSpeed: groundSpeed !== undefined ? parseFloat(groundSpeed) : null,
        verticalSpeed: verticalSpeed !== undefined ? parseFloat(verticalSpeed) : null,
        batteryLevel: batteryLevel !== undefined ? parseFloat(batteryLevel) : null,
        voltage: voltage !== undefined ? parseFloat(voltage) : null,
        current: current !== undefined ? parseFloat(current) : null,
        gpsFixType: gpsFixType !== undefined ? parseInt(gpsFixType) : null,
        satelliteCount: satelliteCount !== undefined ? parseInt(satelliteCount) : null,
        flightMode: flightMode || null,
        armed: armed !== undefined ? Boolean(armed) : false,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Telemetry data stored successfully',
      data: telemetry
    });
  } catch (error) {
    console.error('Error storing telemetry:', error);
    res.status(500).json({ 
      error: 'Failed to store telemetry data',
      details: error.message 
    });
  }
});

// GET - Get all telemetry data
router.get('/', async (req, res) => {
  try {
    const { droneId, limit = 100, startDate, endDate } = req.query;
    
    // Build filter
    const where = {};
    if (droneId) {
      where.droneId = droneId;
    }
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }
    
    const telemetry = await prisma.telemetry.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: parseInt(limit)
    });
    
    res.json({
      success: true,
      count: telemetry.length,
      data: telemetry
    });
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    res.status(500).json({ 
      error: 'Failed to fetch telemetry data',
      details: error.message 
    });
  }
});

// GET - Get latest telemetry for a specific drone
router.get('/latest', async (req, res) => {
  try {
    const { droneId } = req.query;
    
    if (!droneId) {
      return res.status(400).json({ 
        error: 'droneId query parameter is required',
        example: '/api/telemetry/latest?droneId=drone_01'
      });
    }
    
    const telemetry = await prisma.telemetry.findFirst({
      where: { droneId },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    if (!telemetry) {
      return res.status(404).json({ 
        error: 'No telemetry found for this drone' 
      });
    }
    
    res.json({
      success: true,
      data: telemetry
    });
  } catch (error) {
    console.error('Error fetching latest telemetry:', error);
    res.status(500).json({ 
      error: 'Failed to fetch latest telemetry',
      details: error.message 
    });
  }
});

// GET - Get telemetry statistics for a drone
router.get('/stats/:droneId', async (req, res) => {
  try {
    const { droneId } = req.params;
    const { hours = 24 } = req.query;
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const telemetry = await prisma.telemetry.findMany({
      where: {
        droneId,
        timestamp: {
          gte: since
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
    
    if (telemetry.length === 0) {
      return res.status(404).json({ 
        error: 'No telemetry data found for this time period' 
      });
    }
    
    // Calculate statistics
    const stats = {
      droneId,
      period: `Last ${hours} hours`,
      dataPoints: telemetry.length,
      averageBatteryLevel: telemetry.reduce((sum, t) => sum + (t.batteryLevel || 0), 0) / telemetry.length,
      averageAltitude: telemetry.reduce((sum, t) => sum + t.altitude, 0) / telemetry.length,
      averageGroundSpeed: telemetry.reduce((sum, t) => sum + (t.groundSpeed || 0), 0) / telemetry.length,
      maxAltitude: Math.max(...telemetry.map(t => t.altitude)),
      minBatteryLevel: Math.min(...telemetry.filter(t => t.batteryLevel).map(t => t.batteryLevel)),
      firstDataPoint: telemetry[0].timestamp,
      lastDataPoint: telemetry[telemetry.length - 1].timestamp,
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error calculating telemetry stats:', error);
    res.status(500).json({ 
      error: 'Failed to calculate telemetry statistics',
      details: error.message 
    });
  }
});

// GET - Get telemetry by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const telemetry = await prisma.telemetry.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!telemetry) {
      return res.status(404).json({ 
        error: 'Telemetry data not found' 
      });
    }
    
    res.json({
      success: true,
      data: telemetry
    });
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    res.status(500).json({ 
      error: 'Failed to fetch telemetry data',
      details: error.message 
    });
  }
});

// PUT - Update telemetry data by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      droneId,
      latitude,
      longitude,
      altitude,
      heading,
      groundSpeed,
      verticalSpeed,
      batteryLevel,
      voltage,
      current,
      gpsFixType,
      satelliteCount,
      flightMode,
      armed,
      timestamp
    } = req.body;
    
    // Build update data object with only provided fields
    const updateData = {};
    if (droneId !== undefined) updateData.droneId = droneId;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (altitude !== undefined) updateData.altitude = parseFloat(altitude);
    if (heading !== undefined) updateData.heading = parseFloat(heading);
    if (groundSpeed !== undefined) updateData.groundSpeed = parseFloat(groundSpeed);
    if (verticalSpeed !== undefined) updateData.verticalSpeed = parseFloat(verticalSpeed);
    if (batteryLevel !== undefined) updateData.batteryLevel = parseFloat(batteryLevel);
    if (voltage !== undefined) updateData.voltage = parseFloat(voltage);
    if (current !== undefined) updateData.current = parseFloat(current);
    if (gpsFixType !== undefined) updateData.gpsFixType = parseInt(gpsFixType);
    if (satelliteCount !== undefined) updateData.satelliteCount = parseInt(satelliteCount);
    if (flightMode !== undefined) updateData.flightMode = flightMode;
    if (armed !== undefined) updateData.armed = Boolean(armed);
    if (timestamp !== undefined) updateData.timestamp = new Date(timestamp);
    
    const telemetry = await prisma.telemetry.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    
    res.json({
      success: true,
      message: 'Telemetry data updated successfully',
      data: telemetry
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Telemetry data not found' });
    }
    console.error('Error updating telemetry:', error);
    res.status(500).json({ 
      error: 'Failed to update telemetry data',
      details: error.message 
    });
  }
});

// PATCH - Partially update telemetry data by ID
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Build update data object
    const updateData = {};
    
    // Process each field if provided
    if (updateFields.droneId !== undefined) updateData.droneId = updateFields.droneId;
    if (updateFields.latitude !== undefined) updateData.latitude = parseFloat(updateFields.latitude);
    if (updateFields.longitude !== undefined) updateData.longitude = parseFloat(updateFields.longitude);
    if (updateFields.altitude !== undefined) updateData.altitude = parseFloat(updateFields.altitude);
    if (updateFields.heading !== undefined) updateData.heading = parseFloat(updateFields.heading);
    if (updateFields.groundSpeed !== undefined) updateData.groundSpeed = parseFloat(updateFields.groundSpeed);
    if (updateFields.verticalSpeed !== undefined) updateData.verticalSpeed = parseFloat(updateFields.verticalSpeed);
    if (updateFields.batteryLevel !== undefined) updateData.batteryLevel = parseFloat(updateFields.batteryLevel);
    if (updateFields.voltage !== undefined) updateData.voltage = parseFloat(updateFields.voltage);
    if (updateFields.current !== undefined) updateData.current = parseFloat(updateFields.current);
    if (updateFields.gpsFixType !== undefined) updateData.gpsFixType = parseInt(updateFields.gpsFixType);
    if (updateFields.satelliteCount !== undefined) updateData.satelliteCount = parseInt(updateFields.satelliteCount);
    if (updateFields.flightMode !== undefined) updateData.flightMode = updateFields.flightMode;
    if (updateFields.armed !== undefined) updateData.armed = Boolean(updateFields.armed);
    if (updateFields.timestamp !== undefined) updateData.timestamp = new Date(updateFields.timestamp);
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: 'No valid fields provided for update' 
      });
    }
    
    const telemetry = await prisma.telemetry.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    
    res.json({
      success: true,
      message: 'Telemetry data partially updated successfully',
      data: telemetry
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Telemetry data not found' });
    }
    console.error('Error updating telemetry:', error);
    res.status(500).json({ 
      error: 'Failed to update telemetry data',
      details: error.message 
    });
  }
});

// DELETE - Delete specific telemetry by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.telemetry.delete({
      where: { id: parseInt(id) },
    });
    
    res.json({
      success: true,
      message: 'Telemetry data deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Telemetry data not found' });
    }
    console.error('Error deleting telemetry:', error);
    res.status(500).json({ 
      error: 'Failed to delete telemetry data',
      details: error.message 
    });
  }
});

// DELETE - Delete old telemetry data (cleanup)
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const result = await prisma.telemetry.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });
    
    res.json({
      success: true,
      message: `Deleted telemetry data older than ${days} days`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error cleaning up telemetry:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup telemetry data',
      details: error.message 
    });
  }
});

export default router;
