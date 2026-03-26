'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import VideoPlayer from '@/components/VideoPlayer';

// Dynamic import for ChatBox to avoid SSR issues
const ChatBox = dynamic(() => import('@/components/ChatBox'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-3"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading chat...</p>
      </div>
    </div>
  )
});

interface Movie {
  id: string;
  name: string;
  link: string;
  imdb: string;
  description: string;
}

interface WatchLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default function WatchLayout({ children, params }: WatchLayoutProps) {
  const resolvedParams = use(params);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(true);
  const [movieId, setMovieId] = useState<string>('');
  const [movieLink, setMovieLink] = useState<string>('');

  // Get movie ID from params
  useEffect(() => {
    if (resolvedParams?.id) {
      setMovieId(resolvedParams.id);
    }
  }, [resolvedParams]);

  const isOlivia = selectedUser === 'olivia';
  const themeColor = isOlivia ? 'pink' : 'blue';

  // Handle user selection
  const handleUserSelect = (user: string) => {
    setSelectedUser(user);
    setShowUserModal(false);
  };

  // Fetch movie data
  useEffect(() => {
    if (!movieId) return;
    
    const fetchMovie = async () => {
      try {
        const response = await fetch('/api/movies');
        const movies: Movie[] = await response.json();
        const foundMovie = movies.find(m => m.id === movieId);
        
        if (foundMovie) {
          setMovie(foundMovie);
          setMovieLink(foundMovie.link);
        }
      } catch (err) {
        console.error('Failed to load movie', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  // Show user modal first
  if (showUserModal) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-5xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Who&apos;s watching?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Select your profile to join the watch party
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleUserSelect('olivia')}
                className="flex flex-col items-center p-6 rounded-xl border-2 border-pink-200 dark:border-pink-700 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all group"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">👩</div>
                <span className="font-semibold text-pink-600 dark:text-pink-400">Olivia</span>
                <span className="text-xs text-pink-400 dark:text-pink-500 mt-1">Pink Theme</span>
              </button>
              
              <button
                onClick={() => handleUserSelect('kumar')}
                className="flex flex-col items-center p-6 rounded-xl border-2 border-blue-200 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">👨</div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Kumar</span>
                <span className="text-xs text-blue-400 dark:text-blue-500 mt-1">Blue Theme</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fixed Video Player Section - Always visible at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900">
        {/* Header */}
        <header className={`bg-gray-900 text-white shadow-lg border-b-4 ${isOlivia ? 'border-pink-500' : 'border-blue-500'}`}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Back to Library"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-lg font-bold truncate max-w-[200px] md:max-w-none">
                    {movie?.name || 'Loading...'}
                  </h1>
                  <p className="text-gray-400 text-xs">
                    Zivic Theatre
                  </p>
                </div>
              </div>

              {movie?.imdb && (
                <a
                  href={movie.imdb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.5 3h-5v5h5v-5zM19.5 8h-5v5h5v-5zM3 3h5v5H3V3zm0 5h5v11H3V8zm16.5 0h5v11h-5V8z"/>
                  </svg>
                  IMDb
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Fixed Video Player */}
        <div className="w-full bg-black">
          <VideoPlayer
            movieId={movieId}
            movieLink={movieLink}
            user={selectedUser || 'kumar'}
          />
        </div>

        {/* Movie Description - Below video */}
        {movie?.description && (
          <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
            <p className="text-gray-300 text-sm line-clamp-2">
              {movie.description}
            </p>
          </div>
        )}
      </div>

      {/* Scrollable Chat Area - Below fixed video */}
      <div className="pt-[calc(56vw+140px)] md:pt-[calc(56vw+160px)] lg:pt-[calc(56vw+180px)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <ChatBox user={selectedUser || 'kumar'} theme={themeColor} />
        </div>
      </div>
    </div>
  );
}
