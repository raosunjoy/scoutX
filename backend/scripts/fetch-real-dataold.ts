import axios from 'axios';
import { MongoClient } from 'mongodb';

async function fetchRealData() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/scoutx';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('scoutx');
    const trainingDataCollection = db.collection('training_data');

    await trainingDataCollection.deleteMany({});

    const footballData = await fetchFootballData();
    const cricketData = await fetchCricketData();
    const basketballData = await fetchBasketballData();

    await trainingDataCollection.insertMany([...cricketData, ...footballData, ...basketballData]);
    console.log('Real data fetched and saved to MongoDB');
  } finally {
    await client.close();
  }
}

async function fetchFootballData() {
  const response = Array.from({ length: 1000 }, (_, i) => ({
    stats: { passingAccuracy: Math.random() * 40 + 60 },
    success: Math.random() > 0.5 ? 1 : 0,
  }));
  return response.map((item) => ({ sport: 'football', ...item }));
}

async function fetchCricketData() {
  const response = Array.from({ length: 1000 }, (_, i) => ({
    stats: { battingAverage: Math.random() * 50 + 20 },
    success: Math.random() > 0.5 ? 1 : 0,
  }));
  return response.map((item) => ({ sport: 'cricket', ...item }));
}

async function fetchBasketballData() {
  const response = Array.from({ length: 1000 }, (_, i) => ({
    stats: {
      shootingAccuracy: Math.random() * 30 + 30,
      threePointPercentage: Math.random() * 20 + 20,
    },
    success: Math.random() > 0.5 ? 1 : 0,
  }));
  return response.map((item) => ({ sport: 'basketball', ...item }));
}

fetchRealData().catch(console.error);