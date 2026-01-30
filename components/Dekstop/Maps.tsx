'use client'

import { useState, useEffect } from 'react';

function Maps() {
  const [mapUrl, setMapUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const url = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          setMapUrl(url);
          setIsLoading(false);
        },
        () => {
          // Fallback to default location (Delhi, India)
          const url = `https://maps.google.com/maps?q=28.6139,77.2090&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          setMapUrl(url);
          setIsLoading(false);
        }
      );
    } else {
      // Fallback if geolocation not supported
      const url = `https://maps.google.com/maps?q=28.6139,77.2090&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      setMapUrl(url);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen">
      <div className="h-full w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-gray-700">Loading map...</p>
          </div>
        )}
        {mapUrl && (
          <iframe 
            src={mapUrl}
            className="w-full h-full border-0" 
            title="Google Maps"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </div>
  );
}

export default Maps;