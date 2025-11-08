const express = require('express');
const cors = require('cors');
const app = express();
const port = 3002;

// METRICS: Import prom-client
const client = require('prom-client');

// METRICS: Create a Registry to collect metrics
const register = new client.Registry();

// METRICS: Collect default Node.js metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// METRICS: Define a Gauge for inventory stock levels
const inventoryStockGauge = new client.Gauge({
  name: 'inventory_stock_level_total',
  help: 'Current stock level of each item',
  labelNames: ['item'],
  registers: [register],
});

// METRICS: Define a Counter for items reduced/sold
const itemsReducedCounter = new client.Counter({
  name: 'inventory_items_reduced_total',
  help: 'Total number of items reduced from stock',
  labelNames: ['item'],
  registers: [register],
});

// METRICS: Define a Counter for HTTP requests
const httpRequestsCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});


app.use(cors());
app.use(express.json());

// In-memory database for inventory
let inventory = {
  "item1": 100,
  "item2": 50,
  "item3": 200
};

// METRICS: Initialize the gauge values on startup
for (const item in inventory) {
  inventoryStockGauge.set({ item: item }, inventory[item]);
}

// METRICS: Middleware to count all requests
app.use((req, res, next) => {
  res.on('finish', () => {
    // Record the request
    httpRequestsCounter.inc({
      method: req.method,
      route: req.path,
      status_code: res.statusCode
    });
  });
  next();
});

// METRICS: Create a new /metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});


// GET /inventory - Returns all inventory
app.get('/inventory', (req, res) => {
  console.log('[Inventory Service] GET /inventory - Returning all stock');
  res.json(inventory);
});

// POST /inventory/reduce - Reduces stock for an item
app.post('/inventory/reduce', (req, res) => {
  const { item, quantity } = req.body;
  const numQuantity = parseInt(quantity, 10);

  console.log(`[Inventory Service] POST /inventory/reduce - Request to reduce ${item} by ${numQuantity}`);

  if (!inventory.hasOwnProperty(item)) {
    console.log(`[Inventory Service] Item not found: ${item}`);
    // Note: We are not calling the metrics middleware for this response,
    // but the `app.use` middleware above will still catch it.
    return res.status(400).json({ success: false, message: 'Item not found' });
  }

  if (inventory[item] >= numQuantity) {
    inventory[item] -= numQuantity;

    // METRICS: Update metrics on successful reduction
    inventoryStockGauge.set({ item: item }, inventory[item]);
    itemsReducedCounter.inc({ item: item }, numQuantity);

    console.log(`[Inventory Service] Success. New stock for ${item}: ${inventory[item]}`);
    res.json({ success: true, item: item, newStock: inventory[item] });
  } else {
    console.log(`[Inventory Service] Insufficient stock for ${item}. Have: ${inventory[item]}, Need: ${numQuantity}`);
    res.status(400).json({ success: false, message: 'Insufficient stock' });
  }
});


app.listen(port, () => {
  console.log(`Inventory Service listening on port ${port}`);
});