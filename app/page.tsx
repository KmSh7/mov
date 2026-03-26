import Link from 'next/link';
import MovieList from '@/components/MovieList';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Simple Navbar */}
      <header className="bg-gray-900 text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xl font-bold tracking-tight hover:text-orange-500 transition-colors">
                Zivic Theatre
              </Link>
            </div>
            
            <Link
              href="/add"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Movie
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <Hero />

      {/* Movie List Component */}
      <MovieList />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="flex items-center justify-center gap-2">
            <span className="text-orange-500">🎬</span>
            Zivic Theatre &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}
