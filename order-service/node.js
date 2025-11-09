const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3001;

// Import our new metrics tools (from the same folder)
const { register, createMetricsMiddleware, Counter } = require('./metrics');

// COUNTER for total orders processed
const ordersTotalCounter = Counter({
  name: 'orders_total',
  help: 'Total number of orders processed',
  labelNames: ['service', 'status'], // Status: 'success', 'failed_stock', 'error'
});

// COUNTER for total value of orders
const ordersValueTotalCounter = Counter({
  name: 'orders_value_total',
  help: 'Total monetary value of successful orders',
  labelNames: ['service'],
});

app.use(cors());
app.use(express.json());

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';

// Apply the metrics middleware
app.use(createMetricsMiddleware('order-service'));

// --- Health Check Endpoint ---
app.get('/healthz', (req, res) => {
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

app.post('/orders', async (req, res) => {
  const { item, quantity } = req.body;
  console.log(`[Order Service] Received order for ${quantity} of ${item}`);

  if (!item || !quantity) {
    return res.status(400).json({ error: 'Missing item or quantity' });
  }

  try {
    // Simulate "reserving" inventory by calling the inventory service
    console.log(`[Order Service] Checking inventory for ${item}...`);
    const response = await axios.post(`${INVENTORY_SERVICE_URL}/inventory/reduce`, { item, quantity });

    if (response.data.success) {
      console.log(`[Order Service] Inventory reduced successfully. Order placed.`);
      // In a real app, you would save the order to a database here
      const orderId = `ORDER-${Date.now()}`;
      res.status(201).json({ success: true, orderId: orderId, message: 'Order placed!' });
    } else {
      console.log(`[Order Service] Failed to reduce inventory. Order not placed.`);
      res.status(400).json({ success: false, message: response.data.message || 'Insufficient stock' });
    }
  } catch (error) {
    console.error('[Order Service] Error communicating with Inventory Service:', error.message);
    res.status(500).json({ error: 'Error communicating with Inventory Service' });
  }
});

app.listen(port, () => {
  console.log(`Order Service listening on port ${port}`);
});