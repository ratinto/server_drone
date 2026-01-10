import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import coordinatesRouter from './routes/coordinates.js';
import telemetryRouter from './routes/telemetry.js';
import commandsRouter from './routes/commands.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Drone Delivery Server API',
    description: 'Manages coordinates for drone detection and delivery system, telemetry data from Pixhawk, and drone control commands',
    production_url: 'https://server-drone.vercel.app',
    endpoints: {
      coordinates: '/api/coordinates',
      unvisited: '/api/coordinates/status/unvisited',
      pending: '/api/coordinates/status/pending',
      telemetry: '/api/telemetry',
      latestTelemetry: '/api/telemetry/latest?droneId=<droneId>',
      telemetryStats: '/api/telemetry/stats/<droneId>',
      commands: '/api/commands',
      armDrone: '/api/commands/arm',
      disarmDrone: '/api/commands/disarm',
      rtl: '/api/commands/rtl',
      land: '/api/commands/land',
      takeoff: '/api/commands/takeoff',
      goto: '/api/commands/goto',
      pendingCommands: '/api/commands/pending/<droneId>',
    },
  });
});

app.use('/api/coordinates', coordinatesRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/commands', commandsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel serverless
export default app;

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}
