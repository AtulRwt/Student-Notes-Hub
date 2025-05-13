const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Simple test endpoints
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 