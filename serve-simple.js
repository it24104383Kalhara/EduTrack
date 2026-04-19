const express = require('express');
const path = require('path');

const app = express();
const port = 5176;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the simple dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'simple-dashboard.html'));
});

app.listen(port, () => {
  console.log(`Simple dashboard server running on http://localhost:${port}`);
  console.log('Open your browser and navigate to: http://localhost:5176');
});
