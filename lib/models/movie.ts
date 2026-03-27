import { getDatabase } from '../mongodb';

const MOVIES_COLLECTION = 'movies';

/**
 * Movie interface
 */
export interface Movie {
  _id?: string;
  id: string;
  name: string;
  link: string;
  imdb: string;
  description: string;
  thumbnail?: string;
}

/**
 * Get all movies from MongoDB
 */
export async function getAllMovies(): Promise<Movie[]> {
  const db = await getDatabase();
  const collection = db.collection<Movie>(MOVIES_COLLECTION);
  
  const movies = await collection.find({}).toArray();
  
  
  return movies;
}

/**
 * Add a new movie to MongoDB
 */
export async function addMovie(name: string, link: string, imdb?: string, description?: string, thumbnail?: string): Promise<Movie> {
  const db = await getDatabase();
  const collection = db.collection<Movie>(MOVIES_COLLECTION);
  
  // Generate unique ID
  const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  
  const newMovie: Movie = {
    id,
    name,
    link,
    imdb: imdb || '',
    description: description || '',
    thumbnail: thumbnail || ''
  };
  
  await collection.insertOne(newMovie);
  
  
  return newMovie;
}

/**
 * Get a movie by ID
 */
export async function getMovieById(id: string): Promise<Movie | null> {
  const db = await getDatabase();
  const collection = db.collection<Movie>(MOVIES_COLLECTION);
  
  const movie = await collection.findOne({ id });
  
  return movie;
}

/**
 * Delete a movie by ID
 */
export async function deleteMovie(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<Movie>(MOVIES_COLLECTION);
  
  const result = await collection.deleteOne({ id });
  
  
  return result.deletedCount > 0;
}

/**
 * Initialize movies from existing JSON data
 */
export async function initializeMovies(movies: Movie[]): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<Movie>(MOVIES_COLLECTION);
  
  // Clear existing data first
  await collection.deleteMany({});
  
  if (movies.length > 0) {
    await collection.insertMany(movies);
  }
}