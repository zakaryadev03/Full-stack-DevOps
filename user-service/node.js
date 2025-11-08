const express = require('express');
const cors = require('cors');
const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

// In-memory database for users
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' }
];

// GET /users - Returns all users
app.get('/users', (req, res) => {
  console.log('[User Service] GET /users - Returning all users');
  res.json(users);
});

// GET /users/:id - Returns a single user (Example of another endpoint)
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    console.log(`[User Service] GET /users/${req.params.id} - Found user`);
    res.json(user);
  } else {
    console.log(`[User Service] GET /users/${req.params.id} - User not found`);
    res.status(404).json({ error: 'User not found' });
  }
});

app.listen(port, () => {
  console.log(`User Service listening on port ${port}`);
});