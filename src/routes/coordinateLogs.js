import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// 1. Create a single coordinate log entry
router.post('/', async (req, res) => {
  try {
    const { latitude, longitude, altitude, heading, speed, timestamp } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const coordinateLog = await prisma.coordinateLogs.create({
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        altitude: altitude ? parseFloat(altitude) : null,
        heading: heading ? parseFloat(heading) : null,
        speed: speed ? parseFloat(speed) : null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    res.status(201).json({
      message: 'Coordinate log created successfully',
      log: coordinateLog,
    });
  } catch (error) {
    console.error('Error creating coordinate log:', error);
    res.status(500).json({ error: 'Failed to create coordinate log' });
  }
});

// 2. Batch upload multiple coordinate logs
router.post('/batch', async (req, res) => {
  try {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ error: 'logs array is required' });
    }

    const formattedLogs = logs.map(log => ({
      latitude: parseFloat(log.latitude),
      longitude: parseFloat(log.longitude),
      altitude: log.altitude ? parseFloat(log.altitude) : null,
      heading: log.heading ? parseFloat(log.heading) : null,
      speed: log.speed ? parseFloat(log.speed) : null,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
    }));

    const result = await prisma.coordinateLogs.createMany({
      data: formattedLogs,
    });

    res.status(201).json({
      message: 'Coordinate logs uploaded successfully',
      count: result.count,
    });
  } catch (error) {
    console.error('Error uploading coordinate logs:', error);
    res.status(500).json({ error: 'Failed to upload coordinate logs' });
  }
});

// 3. Get all coordinate logs
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    
    const logs = await prisma.coordinateLogs.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    const total = await prisma.coordinateLogs.count();

    res.json({
      message: 'Coordinate logs retrieved successfully',
      count: logs.length,
      total: total,
      logs,
    });
  } catch (error) {
    console.error('Error fetching coordinate logs:', error);
    res.status(500).json({ error: 'Failed to fetch coordinate logs' });
  }
});

// 4. Get coordinate logs by time range
router.get('/range', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime and endTime are required' });
    }

    const logs = await prisma.coordinateLogs.findMany({
      where: {
        timestamp: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json({
      message: 'Coordinate logs retrieved successfully',
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error fetching coordinate logs by range:', error);
    res.status(500).json({ error: 'Failed to fetch coordinate logs' });
  }
});

// 5. Get latest coordinate log
router.get('/latest', async (req, res) => {
  try {
    const latestLog = await prisma.coordinateLogs.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latestLog) {
      return res.status(404).json({ error: 'No coordinate logs found' });
    }

    res.json({
      message: 'Latest coordinate log retrieved successfully',
      log: latestLog,
    });
  } catch (error) {
    console.error('Error fetching latest coordinate log:', error);
    res.status(500).json({ error: 'Failed to fetch latest coordinate log' });
  }
});

// 6. Get coordinate log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.coordinateLogs.findUnique({
      where: { id: parseInt(id) },
    });

    if (!log) {
      return res.status(404).json({ error: 'Coordinate log not found' });
    }

    res.json({
      message: 'Coordinate log retrieved successfully',
      log,
    });
  } catch (error) {
    console.error('Error fetching coordinate log:', error);
    res.status(500).json({ error: 'Failed to fetch coordinate log' });
  }
});

// 7. Delete coordinate log by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.coordinateLogs.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Coordinate log deleted successfully' });
  } catch (error) {
    console.error('Error deleting coordinate log:', error);
    res.status(500).json({ error: 'Failed to delete coordinate log' });
  }
});

// 8. Delete all coordinate logs (cleanup)
router.delete('/', async (req, res) => {
  try {
    const result = await prisma.coordinateLogs.deleteMany({});

    res.json({
      message: 'All coordinate logs deleted successfully',
      count: result.count,
    });
  } catch (error) {
    console.error('Error deleting coordinate logs:', error);
    res.status(500).json({ error: 'Failed to delete coordinate logs' });
  }
});

// 9. Get statistics for coordinate logs
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await prisma.coordinateLogs.count();
    
    const oldest = await prisma.coordinateLogs.findFirst({
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    });

    const newest = await prisma.coordinateLogs.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    res.json({
      message: 'Coordinate logs statistics retrieved successfully',
      stats: {
        totalLogs: total,
        oldestLog: oldest?.timestamp || null,
        newestLog: newest?.timestamp || null,
      },
    });
  } catch (error) {
    console.error('Error fetching coordinate logs stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
