'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddMovie() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    imdb: '',
    description: '',
    thumbnail: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add movie');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-2xl mx-auto px-4">
        {/* Simple Navbar - No Image */}
        <header className="bg-gray-900 text-white rounded-t-xl border-b-4 border-orange-500 mb-6">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold tracking-tight hover:text-orange-500 transition-colors">
                Zivic Theatre
              </Link>
              
              <Link
                href="/"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Back
              </Link>
            </nav>
          </div>
        </header>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 border-b-4 border-orange-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-xl">
                ➕
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Add New Movie
                </h1>
                <p className="text-gray-400 text-sm">
                  Add a movie to your library
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Movie Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Movie Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter movie name"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>

            {/* Movie Link */}
            <div>
              <label htmlFor="link" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Movie Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="link"
                name="link"
                required
                value={formData.link}
                onChange={handleChange}
                placeholder="YouTube, Google Drive, or direct video URL"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                <p><strong>YouTube:</strong> Use embed URL (e.g., https://www.youtube.com/embed/...)</p>
                <p><strong>Google Drive:</strong> Share link (e.g., https://drive.google.com/file/d/FILE_ID/view)</p>
                <p><strong>Direct URL:</strong> Any direct video file URL</p>
              </div>
            </div>

            {/* IMDb Link */}
            <div>
              <label htmlFor="imdb" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                IMDb Link
              </label>
              <input
                type="url"
                id="imdb"
                name="imdb"
                value={formData.imdb}
                onChange={handleChange}
                placeholder="https://www.imdb.com/title/..."
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Short description of the movie"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors resize-none"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label htmlFor="thumbnail" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Thumbnail URL
              </label>
              <input
                type="url"
                id="thumbnail"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="https://example.com/thumbnail.jpg"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <p>Optional: URL to a thumbnail image for the movie</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding Movie...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Library
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}