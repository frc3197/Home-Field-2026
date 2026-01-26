const fs = require('fs');
const path = require('path');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const express = require('express');
const app = express();
const server = createServer(app);
const port = 3000;
const ipAddr = "10.31.97.99";
//const ipAddr = "0.0.0.0";
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
  if (fuelScored + amount >= 0)
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

app.post('/save-match', (req, res) => {
  const amount = req.body.amount || -1;
  const timestamps = req.body.timestamps || [];
  const name = req.body.name || "Blank Match";
  const date = req.body.date || Date.now();
  const tag = req.body.tag || "Unknown";

  const data = {
    amount,
    timestamps,
    name,
    date,
    tag
  }

  console.log(timestamps);

  saveMatchFile(path.join(__dirname, 'saved_matches'), name + '.json', data);

  res.json({ success: true });
});

app.get('/get-all-matches', (req, res) => {
  const matches = loadAllJsons(path.join(__dirname, 'saved_matches'));
  res.json(matches);
});

async function saveMatchFile(folderPath, fileName, timestampData) {
  try {
    await fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) throw err;
      console.log(`Directory ensured: ${folderPath}`);
    });

    const filePath = path.join(folderPath, fileName);
    await fs.writeFile(filePath, JSON.stringify(timestampData), (err) => {
      if (err) throw err;
      console.log('File has been saved!');
    });
  } catch (err) {
    console.error(`Error saving file: ${err.message}`);
  }
}

function loadAllJsons(dirPath) {
  var jsonFiles;
  try {
    jsonFiles = fs.readdirSync(dirPath).filter(file => {
      return path.extname(file).toLowerCase() === '.json';
    });
  } catch (error) {
    console.error(`Error reading or parsing JSON folder`, error);
    return null;
  }

  const jsonData = jsonFiles.map(file => {
    const filePath = path.join(dirPath, file);
    try {
      const fileData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileData);
    } catch (error) {
      console.error(`Error reading or parsing JSON file: ${file}`, error);
      return null;
    }
  });

  return jsonData.filter(data => data !== null);
}