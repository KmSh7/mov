'use client';

import { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import Link from 'next/link';

interface Movie {
  id: string;
  name: string;
  link: string;
  imdb: string;
  description: string;
}

export default function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies');
      if (!res.ok) {
        throw new Error('Failed to fetch movies');
      }
      const data = await res.json();
      setMovies(data);
    } catch (err) {
      setError('Failed to load movies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🎬</div>
          <p className="text-gray-500 dark:text-gray-400">Loading movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <span className="text-orange-500">📽️</span>
          Movie Library
        </h2>
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          {movies.length} {movies.length === 1 ? 'movie' : 'movies'} available
        </div>
      </div>
      
      {movies.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">🎥</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No movies in library
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add your first movie to start watching!
          </p>
          <Link
            href="/add"
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Movie
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}