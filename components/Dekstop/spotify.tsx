'use client'

import { useState, useEffect } from 'react';

export default function Spotify() {
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    setContentLoaded(true);
  }, []);

  return (
    <div className="w-full h-screen">
      {contentLoaded && (
           <iframe
                    title="Spotify"
                    style={{ borderRadius: "20px", border: "2px solid black" }}
                    src="https://open.spotify.com/embed/playlist/49fU13lA1yUQbDye9HsBLQ?utm_source=generator&theme=0"
                    width="100%"
                    height="100%"
                    
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  ></iframe>
      )}
    </div>
  );
}