import fs from 'fs';
import path from 'path';
import { getDatabase } from '@/lib/mongodb';
import { updateVideoState } from '@/lib/models/videoState';
import { initializeMovies } from '@/lib/models/movie';

/**
 * Initialize the MongoDB database with existing data from JSON files
 * Run this script once to migrate existing data: npx tsx scripts/init-db.ts
 */

async function initializeDatabase() {
  console.log('[INIT] Starting database initialization...');
  
  try {
    // Get database connection
    const db = await getDatabase();
    console.log('[INIT] Connected to MongoDB');
    
    // Load and migrate video state
    const statePath = path.join(process.cwd(), 'data', 'state.json');
    if (fs.existsSync(statePath)) {
      const stateData = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      await updateVideoState(stateData);
      console.log('[INIT] Video state migrated');
    }
    
    // Load and migrate movies
    const moviesPath = path.join(process.cwd(), 'data', 'movies.json');
    if (fs.existsSync(moviesPath)) {
      const moviesData = JSON.parse(fs.readFileSync(moviesPath, 'utf-8'));
      await initializeMovies(moviesData);
      console.log('[INIT] Movies migrated:', moviesData.length, 'movies');
    }
    
    console.log('[INIT] Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('[INIT] Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();