const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 8000;

// Import our new metrics tools (from the same folder)
const { register, createMetricsMiddleware } = require('./metrics');

app.use(cors());
app.use(express.json());
app.use(createMetricsMiddleware('api-gateway'));

// Define service URLs
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3003';

// --- Health Check Endpoint ---
app.get('/healthz', (req, res) => {
  // In a real app, you might check DB connections, etc.
  res.status(200).send('OK');
});

// --- Metrics Endpoint ---
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});


// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[Gateway] Request to: ${req.method} ${req.path}`);
  next();
});

// --- User Service Routes ---
app.get('/api/users', async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error communicating with User Service' });
  }
});

// --- Inventory Service Routes ---
app.get('/api/inventory', async (req, res) => {
  try {
    const response = await axios.get(`${INVENTORY_SERVICE_URL}/inventory`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error communicating with Inventory Service' });
  }
});

// --- Order Service Routes ---
app.post('/api/orders', async (req, res) => {
  try {
    const response = await axios.post(`${ORDER_SERVICE_URL}/orders`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error communicating with Order Service' });
  }
});


app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});