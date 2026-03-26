import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Path to movies.json file
const moviesFilePath = path.join(process.cwd(), 'data', 'movies.json');

// GET /api/movies - Fetch all movies
export async function GET() {
  try {
    const fileContent = fs.readFileSync(moviesFilePath, 'utf-8');
    const movies = JSON.parse(fileContent);
    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error reading movies:', error);
    return NextResponse.json({ error: 'Failed to read movies' }, { status: 500 });
  }
}

// POST /api/movies - Add a new movie
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, link, imdb, description } = body;

    // Validate required fields
    if (!name || !link) {
      return NextResponse.json(
        { error: 'Name and link are required' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    // Read existing movies
    const fileContent = fs.readFileSync(moviesFilePath, 'utf-8');
    const movies = JSON.parse(fileContent);

    // Add new movie
    const newMovie = {
      id,
      name,
      link,
      imdb: imdb || '',
      description: description || ''
    };

    movies.push(newMovie);

    // Write back to file
    fs.writeFileSync(moviesFilePath, JSON.stringify(movies, null, 2));

    return NextResponse.json(newMovie, { status: 201 });
  } catch (error) {
    console.error('Error adding movie:', error);
    return NextResponse.json({ error: 'Failed to add movie' }, { status: 500 });
  }
}