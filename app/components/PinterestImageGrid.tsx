'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


interface PinterestImage {
  url: string;
}

export default function PinterestImageGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [bookmark, setBookmark] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchImages = async (query: string, reset: boolean = true) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pinterest/searchimage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search: query,
          bookmark: reset ? null : bookmark,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch images');
      }
      
      setImages(reset ? data.images : [...images, ...data.images]);
      setBookmark(data.bookmark);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching Pinterest images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchImages(searchQuery);
  };

  const loadMore = () => {
    if (bookmark) {
      searchImages(searchQuery, false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Pinterest Image Search</h2>
      
      <div className="flex gap-2 mb-8">
        <Input
          placeholder="Search for images..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {images.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
            {images.map((imageUrl, index) => (
              <div key={`${imageUrl}-${index}`} className="overflow-hidden h-[250px] transition-all hover:scale-[1.02]">
                <div className="p-0 h-full">
                  <div className="relative w-full h-full">
                    <Image
                      src={imageUrl}
                      alt={`Pinterest image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {bookmark && (
            <div className="mt-8 text-center">
              <Button onClick={loadMore} disabled={loading} variant="outline">
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <div className="text-center py-12 text-gray-500">
            Search for something to see images
          </div>
        )
      )}
    </div>
  );
}