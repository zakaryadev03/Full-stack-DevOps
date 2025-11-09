const express = require('express');
const cors = require('cors');
const app = express();
const port = 3003;

// Import our new metrics tools (from the same folder)
const { register, createMetricsMiddleware, Gauge } = require('./metrics');

// --- Service-specific Metrics ---

// GAUGE for total number of users
const usersTotalGauge = Gauge({
  name: 'users_total',
  help: 'Total number of users in the system',
  labelNames: ['service'],
});

// --- Setup ---

app.use(cors());
app.use(express.json());

// Apply the metrics middleware
app.use(createMetricsMiddleware('user-service'));

// In-memory user database
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

// Set initial gauge value
usersTotalGauge.set({ service: 'user-service' }, users.length);

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

// GET /users - Returns all users
app.get('/users', (req, res) => {
  console.log('[User Service] GET /users - Returning all users');
  res.json(users);
});

// Note: In a real app, a POST /users endpoint would increment the usersTotalGauge


app.listen(port, () => {
  console.log(`User Service (Folder: user-service) listening on port ${port}`);
});