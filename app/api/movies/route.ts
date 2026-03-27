import { NextResponse } from 'next/server';
import { getAllMovies, addMovie } from '@/lib/models/movie';

export const dynamic = 'force-dynamic';

// GET /api/movies - Fetch all movies from MongoDB
export async function GET() {
  try {
    const movies = await getAllMovies();
    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching movies from MongoDB:', error);
    return NextResponse.json({ error: 'Failed to read movies' }, { status: 500 });
  }
}

// POST /api/movies - Add a new movie to MongoDB
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, link, imdb, description, thumbnail } = body;

    // Validate required fields
    if (!name || !link) {
      return NextResponse.json(
        { error: 'Name and link are required' },
        { status: 400 }
      );
    }

    // Add movie to MongoDB
    const newMovie = await addMovie(name, link, imdb, description, thumbnail);

    return NextResponse.json(newMovie, { status: 201 });
  } catch (error) {
    console.error('Error adding movie to MongoDB:', error);
    return NextResponse.json({ error: 'Failed to add movie' }, { status: 500 });
  }
}