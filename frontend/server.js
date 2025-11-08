import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 80;
const GATEWAY_URL = process.env.GATEWAY_URL;

// Serve static assets (CSS, JS, images)
app.use(express.static('public'));

// Serve index.html and inject env var
app.get('/', (req, res) => {
  let html = fs.readFileSync('./public/index.html', 'utf8');
  html = html.replace('__GATEWAY_URL__', GATEWAY_URL);
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`✅ Frontend running on http://localhost:${PORT}`);
  console.log(`🌐 Gateway URL set to ${GATEWAY_URL}`);
});
