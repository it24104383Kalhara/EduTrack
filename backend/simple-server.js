const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5176;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve the simple dashboard
app.get('/', (req, res) => {
  try {
    const htmlPath = path.resolve(__dirname, '..', 'simple-dashboard.html');
    console.log('Serving file:', htmlPath);
    
    // Check if file exists
    if (!fs.existsSync(htmlPath)) {
      console.error('File not found:', htmlPath);
      return res.status(404).send('Dashboard file not found');
    }
    
    res.sendFile(htmlPath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).send('Server error');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Simple Dashboard Server' });
});

app.listen(port, () => {
  console.log(`Simple dashboard server running on http://localhost:${port}`);
  console.log('Open your browser and navigate to: http://localhost:5176');
});
