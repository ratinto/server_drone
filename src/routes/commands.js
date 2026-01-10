import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// POST - Send ARM command
router.post('/arm', async (req, res) => {
  try {
    const { droneId } = req.body;
    
    if (!droneId) {
      return res.status(400).json({ 
        error: 'droneId is required',
        example: { droneId: "drone_01" }
      });
    }
    
    // Store the command in database for drone to poll
    const command = await prisma.droneCommand.create({
      data: {
        droneId,
        command: 'ARM',
        status: 'PENDING',
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'ARM command sent',
      data: command
    });
  } catch (error) {
    console.error('Error sending ARM command:', error);
    res.status(500).json({ 
      error: 'Failed to send ARM command',
      details: error.message 
    });
  }
});

// POST - Send DISARM command
router.post('/disarm', async (req, res) => {
  try {
    const { droneId } = req.body;
    
    if (!droneId) {
      return res.status(400).json({ 
        error: 'droneId is required',
        example: { droneId: "drone_01" }
      });
    }
    
    const command = await prisma.droneCommand.create({
      data: {
        droneId,
        command: 'DISARM',
        status: 'PENDING',
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'DISARM command sent',
      data: command
    });
  } catch (error) {
    console.error('Error sending DISARM command:', error);
    res.status(500).json({ 
      error: 'Failed to send DISARM command',
      details: error.message 
    });
  }
});

// POST - Send RTL (Return to Launch) command
router.post('/rtl', async (req, res) => {
  try {
    const { droneId } = req.body;
    
    if (!droneId) {
      return res.status(400).json({ 
        error: 'droneId is required',
        example: { droneId: "drone_01" }
      });
    }
    
    const command = await prisma.droneCommand.create({
      data: {
        droneId,
        command: 'RTL',
        status: 'PENDING',
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'RTL (Return to Launch) command sent',
      data: command
    });
  } catch (error) {
    console.error('Error sending RTL command:', error);
    res.status(500).json({ 
      error: 'Failed to send RTL command',
      details: error.message 
    });
  }
});

// POST - Send LAND command
router.post('/land', async (req, res) => {
  try {
    const { droneId } = req.body;
    
    if (!droneId) {
      return res.status(400).json({ 
        error: 'droneId is required',
        example: { droneId: "drone_01" }
      });
    }
    
    const command = await prisma.droneCommand.create({
      data: {
        droneId,
        command: 'LAND',
        status: 'PENDING',
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'LAND command sent',
      data: command
    });
  } catch (error) {
    console.error('Error sending LAND command:', error);
    res.status(500).json({ 
      error: 'Failed to send LAND command',
      details: error.message 
    });
  }
});

// POST - Send TAKEOFF command
router.post('/takeoff', async (req, res) => {
  try {
    const { droneId, altitude } = req.body;
    
    if (!droneId) {
      return res.status(400).json({ 
        error: 'droneId is required',
        example: { droneId: "drone_01", altitude: 10 }
      });
    }
    
    const command = await prisma.droneCommand.create({
      data: {
        droneId,
        command: 'TAKEOFF',
        parameters: altitude ? { altitude: parseFloat(altitude) } : null,
        status: 'PENDING',
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'TAKEOFF command sent',
      data: command
    });
  } catch (error) {
    console.error('Error sending TAKEOFF command:', error);
    res.status(500).json({ 
      error: 'Failed to send TAKEOFF command',
      details: error.message 
    });
  }
});

// POST - Send GOTO command (navigate to coordinates)
router.post('/goto', async (req, res) => {
  try {
    const { droneId, latitude, longitude, altitude } = req.body;
    
    if (!droneId || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'droneId, latitude, and longitude are required',
        example: { 
          droneId: "drone_01", 
          latitude: 37.7749, 
          longitude: -122.4194,
          altitude: 50
        }
      });
    }
    
    const command = await prisma.droneCommand.create({
      data: {
        droneId,
        command: 'GOTO',
        parameters: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          altitude: altitude ? parseFloat(altitude) : null
        },
        status: 'PENDING',
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'GOTO command sent',
      data: command
    });
  } catch (error) {
    console.error('Error sending GOTO command:', error);
    res.status(500).json({ 
      error: 'Failed to send GOTO command',
      details: error.message 
    });
  }
});

// GET - Get pending commands for a drone (Raspberry Pi polls this)
router.get('/pending/:droneId', async (req, res) => {
  try {
    const { droneId } = req.params;
    
    const commands = await prisma.droneCommand.findMany({
      where: {
        droneId,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    res.json({
      success: true,
      count: commands.length,
      data: commands
    });
  } catch (error) {
    console.error('Error fetching pending commands:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pending commands',
      details: error.message 
    });
  }
});

// PATCH - Update command status (Raspberry Pi updates after executing)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, result } = req.body;
    
    if (!status || !['PENDING', 'EXECUTING', 'COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status is required',
        allowed: ['PENDING', 'EXECUTING', 'COMPLETED', 'FAILED']
      });
    }
    
    const updateData = {
      status,
      executedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined
    };
    
    if (result) {
      updateData.result = result;
    }
    
    const command = await prisma.droneCommand.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    
    res.json({
      success: true,
      message: 'Command status updated',
      data: command
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Command not found' });
    }
    console.error('Error updating command status:', error);
    res.status(500).json({ 
      error: 'Failed to update command status',
      details: error.message 
    });
  }
});

// GET - Get all commands for a drone
router.get('/history/:droneId', async (req, res) => {
  try {
    const { droneId } = req.params;
    const { limit = 50, status } = req.query;
    
    const where = { droneId };
    if (status) {
      where.status = status;
    }
    
    const commands = await prisma.droneCommand.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });
    
    res.json({
      success: true,
      count: commands.length,
      data: commands
    });
  } catch (error) {
    console.error('Error fetching command history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch command history',
      details: error.message 
    });
  }
});

// DELETE - Delete a command
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.droneCommand.delete({
      where: { id: parseInt(id) },
    });
    
    res.json({
      success: true,
      message: 'Command deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Command not found' });
    }
    console.error('Error deleting command:', error);
    res.status(500).json({ 
      error: 'Failed to delete command',
      details: error.message 
    });
  }
});

export default router;
