import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import coordinatesRouter from './routes/coordinates.js';

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
    description: 'Manages coordinates for drone detection and delivery system with GPS batch upload support',
    production_url: 'https://server-drone.vercel.app',
    endpoints: {
      createCoordinate: 'POST /api/coordinates',
      batchUpload: 'POST /api/coordinates/trigger-upload (For Raspberry Pi)',
      allCoordinates: 'GET /api/coordinates',
      unvisited: 'GET /api/coordinates/status/unvisited',
      pending: 'GET /api/coordinates/status/pending',
      markVisited: 'PATCH /api/coordinates/:id/visited',
      markDelivered: 'PATCH /api/coordinates/:id/delivered',
    },
  });
});

app.use('/api/coordinates', coordinatesRouter);

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
