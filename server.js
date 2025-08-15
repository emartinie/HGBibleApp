const express = require('express');
const path = require('path');
const app = express();

// Serve each version at a different path
app.use('/v1', express.static(path.join(__dirname, 'v1')));
app.use('/v2', express.static(path.join(__dirname, 'v2')));
app.use('/v3', express.static(path.join(__dirname, 'v3')));
app.use('/v4', express.static(path.join(__dirname, 'v4')));
app.use('/v5', express.static(path.join(__dirname, 'v5')));
app.use('/v6', express.static(path.join(__dirname, 'v6')));

// Optional: redirect root to version1
app.get('/', (req, res) => {
  res.redirect('/v1');
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Multiple BibleApp versions running at http://localhost:${PORT}`);
});
