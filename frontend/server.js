const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 80;
const GATEWAY_URL = process.env.GATEWAY_URL;

// Serve index.html and inject env var
app.get('/', (req, res) => {
  let html = fs.readFileSync('./public/index.html', 'utf8');
  html = html.replace('%%GATEWAY_URL%%', GATEWAY_URL);
  res.send(html);
});

// Serve static assets (CSS, JS, images) AFTER specific routes
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`✅ Frontend running on http://localhost:${PORT}`);
  console.log(`🌐 Gateway URL set to ${GATEWAY_URL}`);
});
