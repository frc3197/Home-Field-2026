const path = require('path');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const express = require('express');
const app = express();
const server = createServer(app);
const port = 3000;
const ipAddr = "10.31.97.99";
const io = new Server(server);

var fuelScored = 0;

io.on('connection', (socket) => {
  console.log('Client connected.');
  socket.emit('fuelScoredUpdate', fuelScored);
});

app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json());

app.post('/add', (req, res) => {
  const amount = req.body.amount || 1;
  if(fuelScored + amount >= 0)
    fuelScored += amount;
  
  // Broadcast the new score to EVERYONE connected
  io.emit('fuelScoredUpdate', fuelScored);
  
  res.json({ success: true, currentFuelScored: fuelScored });
});

app.post('/reset', (req, res) => {
  fuelScored = 0;
  io.emit('fuelScoredUpdate', fuelScored);
  res.json({ success: true, message: "Fuel scored reset" });
});

app.post('/set-match', (req, res) => {
  const match = req.body.match || false;
  io.emit('matchInProgressUpdate', match);
  res.json({ success: true, message: "Match in progress set" });
});

server.listen(port, ipAddr, () => {
  console.log(`Home field interface listening on ${ipAddr} with the port of ${port}`);
});
