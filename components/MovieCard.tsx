'use client';

import { useRouter } from 'next/navigation';

interface Movie {
  id: string;
  name: string;
  link: string;
  imdb: string;
  description: string;
  thumbnail?: string;
}

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/watch/${movie.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="block group cursor-pointer"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
        {/* Movie Poster/Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 flex items-center justify-center overflow-hidden">
          {movie.thumbnail ? (
            <img
              src={movie.thumbnail}
              alt={movie.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent"></div>
              <div className="text-5xl opacity-40 group-hover:opacity-60 transition-opacity transform group-hover:scale-110">
                🎬
              </div>
            </>
          )}
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Watch
          </div>
        </div>

        {/* Movie Info */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 group-hover:text-orange-500 transition-colors line-clamp-1">
            {movie.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
            {movie.description}
          </p>

          {movie.imdb && (
            <a
              href={movie.imdb}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.5 3h-5v5h5v-5zM19.5 8h-5v5h5v-5zM3 3h5v5H3V3zm0 5h5v11H3V8zm16.5 0h5v11h-5V8z"/>
              </svg>
              IMDb
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}