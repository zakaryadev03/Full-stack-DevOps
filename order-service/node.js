const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const INVENTORY_SERVICE_URL = 'http://localhost:3002';

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