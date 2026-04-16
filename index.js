const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || '/data/data.json';

app.use(cors());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize database
function initDB() {
  const defaultData = {
    sets: [
      {
        id: '1',
        setNumber: '10302',
        name: 'Optimus Prime',
        theme: 'Icons',
        pieces: 1508,
        price: 169.99,
        imageUrl: 'https://images.brickset.com/sets/images/10302-1.jpg',
        releaseYear: 2022
      },
      {
        id: '2',
        setNumber: '75192',
        name: 'Millennium Falcon',
        theme: 'Star Wars',
        pieces: 7541,
        price: 799.99,
        imageUrl: 'https://images.brickset.com/sets/images/75192-1.jpg',
        releaseYear: 2017
      },
      {
        id: '3',
        setNumber: '10266',
        name: 'NASA Apollo 11 Lunar Lander',
        theme: 'Creator Expert',
        pieces: 1087,
        price: 99.99,
        imageUrl: 'https://images.brickset.com/sets/images/10266-1.jpg',
        releaseYear: 2019
      },
      {
        id: '4',
        setNumber: '21325',
        name: 'Medieval Blacksmith',
        theme: 'Ideas',
        pieces: 2164,
        price: 149.99,
        imageUrl: 'https://images.brickset.com/sets/images/21325-1.jpg',
        releaseYear: 2021
      }
    ],
    collection: []
  };
  
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    }
  } catch (error) {
    console.log('Database initialization error:', error.message);
  }
}

function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('Database read error:', error.message);
    return { sets: [], collection: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Database write error:', error.message);
  }
}

initDB();

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'LEGO Tracker API is running' });
});

// Get all LEGO sets
app.get('/api/sets', (req, res) => {
  const data = readDB();
  res.json(data.sets);
});

// Get user's collection
app.get('/api/collection', (req, res) => {
  const data = readDB();
  res.json(data.collection);
});

// Add set to collection
app.post('/api/collection', (req, res) => {
  const { setId, status = 'wishlist' } = req.body;
  const data = readDB();
  
  const set = data.sets.find(s => s.id === setId);
  if (!set) {
    return res.status(404).json({ error: 'Set not found' });
  }
  
  const existing = data.collection.find(c => c.setId === setId);
  if (existing) {
    return res.status(400).json({ error: 'Set already in collection' });
  }
  
  const collectionItem = {
    id: Date.now().toString(),
    setId,
    status, // 'wishlist', 'owned', 'building', 'completed'
    addedDate: new Date().toISOString(),
    completedDate: null
  };
  
  data.collection.push(collectionItem);
  writeDB(data);
  
  res.status(201).json(collectionItem);
});

// Update collection item status
app.put('/api/collection/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const data = readDB();
  
  const item = data.collection.find(c => c.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Collection item not found' });
  }
  
  item.status = status;
  if (status === 'completed') {
    item.completedDate = new Date().toISOString();
  }
  
  writeDB(data);
  res.json(item);
});

// Remove from collection
app.delete('/api/collection/:id', (req, res) => {
  const { id } = req.params;
  const data = readDB();
  
  const index = data.collection.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Collection item not found' });
  }
  
  data.collection.splice(index, 1);
  writeDB(data);
  
  res.json({ message: 'Removed from collection' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});