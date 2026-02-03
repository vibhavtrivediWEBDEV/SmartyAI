'use client'

import { useState } from 'react';

export default function Youtube() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full h-screen bg-white relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <p className="text-white">Loading YouTube...</p>
        </div>
      )}
      <iframe 
        src="https://youtube-therohantomar.vercel.app/"
        className="w-full h-full border-0" 
        title="YouTube"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
