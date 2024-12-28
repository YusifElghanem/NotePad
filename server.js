const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve the frontend
app.use(express.static('./'));

// Path to the JSON file
const jsonFilePath = './notepad.json';

// Array to hold connected clients
let clients = [];

// Endpoint to get the content
app.get('/api/notepad', (req, res) => {
  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Error reading file' });
    } else {
      res.json(JSON.parse(data || '{}'));
    }
  });
});

// Endpoint for SSE
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add this client to the list
  clients.push(res);

  // Remove the client when the connection closes
  req.on('close', () => {
    clients = clients.filter((client) => client !== res);
  });
});

// Notify all clients of updates
function notifyClients(content) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify({ content })}\n\n`);
  });
}

// Update saveContent endpoint
app.post('/api/notepad', (req, res) => {
  const { content } = req.body;
  fs.writeFile(jsonFilePath, JSON.stringify({ content }), 'utf8', (err) => {
    if (err) {
      res.status(500).json({ error: 'Error saving file' });
    } else {
      notifyClients(content); // Notify all clients
      res.json({ message: 'Content saved' });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});