import { MongoClient } from 'mongodb';

async function generateSyntheticData() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/scoutx';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('scoutx');
    const trainingDataCollection = db.collection('training_data');

    await trainingDataCollection.deleteMany({});

    const cricketData = Array.from({ length: 1000 }, (_, i) => ({
      sport: 'cricket',
      stats: { battingAverage: Math.random() * 50 + 20 },
      success: Math.random() > 0.5 ? 1 : 0,
    }));

    const footballData = Array.from({ length: 1000 }, (_, i) => ({
      sport: 'football',
      stats: { passingAccuracy: Math.random() * 40 + 60 },
      success: Math.random() > 0.5 ? 1 : 0,
    }));

    const basketballData = Array.from({ length: 1000 }, (_, i) => ({
      sport: 'basketball',
      stats: {
        shootingAccuracy: Math.random() * 30 + 30,
        threePointPercentage: Math.random() * 20 + 20,
      },
      success: Math.random() > 0.5 ? 1 : 0,
    }));

    await trainingDataCollection.insertMany([...cricketData, ...footballData, ...basketballData]);
    console.log('Synthetic data generated and saved to MongoDB');
  } finally {
    await client.close();
  }
}

generateSyntheticData().catch(console.error);