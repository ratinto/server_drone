import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// POST - Store new coordinates detected by drone
router.post('/', async (req, res) => {
  try {
    const { latitude, longitude, altitude, timestamp } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required',
        example: { 
          latitude: 37.7749, 
          longitude: -122.4194,
          altitude: 100.5,
          timestamp: "2026-01-13T10:30:00.000Z"
        }
      });
    }
    
    const data = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
    
    // Add optional fields if provided
    if (altitude !== undefined) {
      data.altitude = parseFloat(altitude);
    }
    if (timestamp) {
      data.timestamp = new Date(timestamp);
    }
    
    const coordinates = await prisma.coordinates.create({
      data,
    });
    
    res.status(201).json({
      success: true,
      message: 'Coordinates stored successfully',
      data: coordinates
    });
  } catch (error) {
    console.error('Error storing coordinates:', error);
    res.status(500).json({ 
      error: 'Failed to store coordinates',
      details: error.message 
    });
  }
});

// GET - Get all coordinates
router.get('/', async (req, res) => {
  try {
    const { isVisited, isDelivered } = req.query;
    
    // Build filter based on query parameters
    const where = {};
    if (isVisited !== undefined) {
      where.isVisited = isVisited === 'true';
    }
    if (isDelivered !== undefined) {
      where.isDelivered = isDelivered === 'true';
    }
    
    const coordinates = await prisma.coordinates.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({
      success: true,
      count: coordinates.length,
      data: coordinates
    });
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch coordinates',
      details: error.message 
    });
  }
});

// GET - Get single coordinate by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const coordinates = await prisma.coordinates.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!coordinates) {
      return res.status(404).json({ 
        error: 'Coordinates not found' 
      });
    }
    
    res.json({
      success: true,
      data: coordinates
    });
  } catch (error) {
    console.error('Error fetching coordinate:', error);
    res.status(500).json({ 
      error: 'Failed to fetch coordinate',
      details: error.message 
    });
  }
});

// PATCH - Mark coordinate as visited
router.patch('/:id/visited', async (req, res) => {
  try {
    const { id } = req.params;
    
    const coordinates = await prisma.coordinates.update({
      where: { id: parseInt(id) },
      data: { isVisited: true },
    });
    
    res.json({
      success: true,
      message: 'Coordinate marked as visited',
      data: coordinates
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Coordinates not found' });
    }
    console.error('Error updating coordinate:', error);
    res.status(500).json({ 
      error: 'Failed to update coordinate',
      details: error.message 
    });
  }
});

// PATCH - Mark coordinate as delivered
router.patch('/:id/delivered', async (req, res) => {
  try {
    const { id } = req.params;
    
    const coordinates = await prisma.coordinates.update({
      where: { id: parseInt(id) },
      data: { 
        isDelivered: true,
        isVisited: true  // Automatically mark as visited when delivered
      },
    });
    
    res.json({
      success: true,
      message: 'Coordinate marked as delivered',
      data: coordinates
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Coordinates not found' });
    }
    console.error('Error updating coordinate:', error);
    res.status(500).json({ 
      error: 'Failed to update coordinate',
      details: error.message 
    });
  }
});

// GET - Get unvisited coordinates (for drones to fetch next target)
router.get('/status/unvisited', async (req, res) => {
  try {
    const coordinates = await prisma.coordinates.findMany({
      where: {
        isVisited: false
      },
      orderBy: {
        createdAt: 'asc'  // Oldest first
      }
    });
    
    res.json({
      success: true,
      count: coordinates.length,
      data: coordinates
    });
  } catch (error) {
    console.error('Error fetching unvisited coordinates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch unvisited coordinates',
      details: error.message 
    });
  }
});

// GET - Get pending deliveries
router.get('/status/pending', async (req, res) => {
  try {
    const coordinates = await prisma.coordinates.findMany({
      where: {
        isVisited: true,
        isDelivered: false
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    res.json({
      success: true,
      count: coordinates.length,
      data: coordinates
    });
  } catch (error) {
    console.error('Error fetching pending deliveries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pending deliveries',
      details: error.message 
    });
  }
});

// POST - Trigger upload of batch coordinates from Raspberry Pi
router.post('/trigger-upload', async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ 
        error: 'coordinates array is required',
        example: { 
          coordinates: [
            { 
              latitude: 37.7749, 
              longitude: -122.4194,
              altitude: 100.5,
              timestamp: "2026-01-13T10:30:00.000Z"
            }
          ]
        }
      });
    }
    
    if (coordinates.length === 0) {
      return res.status(400).json({ 
        error: 'coordinates array cannot be empty'
      });
    }
    
    // Validate and prepare data for batch insert
    const validCoordinates = [];
    const errors = [];
    
    coordinates.forEach((coord, index) => {
      if (coord.latitude === undefined || coord.longitude === undefined) {
        errors.push(`Item ${index}: latitude and longitude are required`);
        return;
      }
      
      const data = {
        latitude: parseFloat(coord.latitude),
        longitude: parseFloat(coord.longitude),
      };
      
      // Add optional fields if provided
      if (coord.altitude !== undefined) {
        data.altitude = parseFloat(coord.altitude);
      }
      if (coord.timestamp) {
        data.timestamp = new Date(coord.timestamp);
      }
      
      validCoordinates.push(data);
    });
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Batch insert all coordinates
    const result = await prisma.coordinates.createMany({
      data: validCoordinates,
      skipDuplicates: true, // Skip if duplicate exists
    });
    
    res.status(201).json({
      success: true,
      message: 'Batch coordinates uploaded successfully',
      inserted: result.count,
      total_sent: coordinates.length
    });
    
  } catch (error) {
    console.error('Error uploading batch coordinates:', error);
    res.status(500).json({ 
      error: 'Failed to upload batch coordinates',
      details: error.message 
    });
  }
});

export default router;
