/**
 * PageLens Backend Server
 * Web analysis platform - crawl, classify, compare
 */

import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/analyze', analyzeRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'PageLens API',
    version: '1.0.0',
    endpoints: {
      'POST /analyze': 'Analyze a website URL',
      'GET /health': 'Health check'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`PageLens backend running on http://localhost:${PORT}`);
  console.log(`API documentation at http://localhost:${PORT}/`);
});

