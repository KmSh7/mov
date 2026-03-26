import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DATABASE || 'watchparty';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Get the MongoDB database connection
 * Uses singleton pattern to avoid creating multiple connections
 */
export async function getDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    await client.connect();
    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('[MONGODB] Connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

/**
 * Close the MongoDB connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}