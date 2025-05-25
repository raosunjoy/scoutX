import { MongoClient } from 'mongodb';

async function seedData() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/scoutx';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('scoutx');
    const cohortsCollection = db.collection('cohorts');

    await cohortsCollection.updateOne(
      { cohortId: 'TEST_2026' },
      {
        $set: {
          players: [
            {
              name: 'John Smith',
              stats: { battingAverage: 45 },
              matchesPlayed: 15,
              successScore: 0.9,
              performanceHistory: [
                {
                  timestamp: new Date('2024-01-01'),
                  academy: 'Elite Cricket Academy',
                  stats: { battingAverage: 38 },
                  successScore: 0.75,
                },
                {
                  timestamp: new Date('2024-06-01'),
                  academy: 'Elite Cricket Academy',
                  stats: { battingAverage: 42 },
                  successScore: 0.82,
                },
                {
                  timestamp: new Date('2025-01-01'),
                  academy: 'Premier Sports Academy',
                  stats: { battingAverage: 45 },
                  successScore: 0.9,
                },
              ],
            },
            {
              name: 'Mike Jones',
              stats: { battingAverage: 30 },
              matchesPlayed: 5,
              successScore: 0.6,
              performanceHistory: [
                {
                  timestamp: new Date('2024-01-01'),
                  academy: 'Youth Cricket Hub',
                  stats: { battingAverage: 25 },
                  successScore: 0.5,
                },
                {
                  timestamp: new Date('2024-06-01'),
                  academy: 'Youth Cricket Hub',
                  stats: { battingAverage: 28 },
                  successScore: 0.55,
                },
                {
                  timestamp: new Date('2025-01-01'),
                  academy: 'Premier Sports Academy',
                  stats: { battingAverage: 30 },
                  successScore: 0.6,
                },
              ],
            },
          ],
        },
      },
      { upsert: true }
    );

    console.log('Player data with performance history seeded for TEST_2026');
  } finally {
    await client.close();
  }
}

seedData().catch(console.error);