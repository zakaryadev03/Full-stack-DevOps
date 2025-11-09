const express = require('express');
const cors = require('cors');
const app = express();
const port = 3002;

// Import our new metrics tools (from the same folder)
const { register, createMetricsMiddleware, Gauge } = require('./metrics');

// --- Service-specific Metrics ---

// GAUGE for current inventory stock
const inventoryStockGauge = Gauge({
  name: 'inventory_stock_level_total',
  help: 'Current stock level of each item',
  labelNames: ['service', 'item'],
});

// --- Setup ---

app.use(cors());
app.use(express.json());

// Apply the metrics middleware
app.use(createMetricsMiddleware('inventory-service'));

// In-memory database for inventory
let inventory = {
  "item1": 100,
  "item2": 50,
  "item3": 200
};

// Initialize the gauge values on startup
const serviceLabel = { service: 'inventory-service' };
for (const item in inventory) {
  inventoryStockGauge.set({ ...serviceLabel, item: item }, inventory[item]);
}

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


// --- Routes ---

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
    return res.status(400).json({ success: false, message: 'Item not found' });
  }

  if (inventory[item] >= numQuantity) {
    inventory[item] -= numQuantity;

    // Update GAUGE metric on successful reduction
    inventoryStockGauge.set({ ...serviceLabel, item: item }, inventory[item]);

    console.log(`[Inventory Service] Success. New stock for ${item}: ${inventory[item]}`);
    res.json({ success: true, item: item, newStock: inventory[item] });
  } else {
    console.log(`[Inventory Service] Insufficient stock for ${item}. Have: ${inventory[item]}, Need: ${numQuantity}`);
    res.status(400).json({ success: false, message: 'Insufficient stock' });
  }
});


app.listen(port, () => {
  console.log(`Inventory Service (Folder: inventory-service) listening on port ${port}`);
});