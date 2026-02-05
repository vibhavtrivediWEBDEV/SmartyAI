'use client'

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Navigation,
  MapPin,
  Coffee,
  ShoppingBag,
  Utensils,
  Hotel,
  Hospital,
  Car,
  Train,
  Bike,
  X,
  Loader2,
  ChevronDown,
  Star,
  Clock,
  Phone,
  Globe,
  Bookmark,
  Share2,
  Route,
  Plus,
  Minus,
  Layers,
  Save
} from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  location: Location;
  category: string;
  timestamp: number;
}

interface NearbyPlace {
  name: string;
  vicinity: string;
  rating?: number;
  types?: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

function AdvancedMaps() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [mapUrl, setMapUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'transit' | 'bicycling'>('driving');
  const [showDirections, setShowDirections] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [zoomLevel, setZoomLevel] = useState(15);
  const [markers, setMarkers] = useState<Array<{ lat: number; lng: number; label: string }>>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [showNearby, setShowNearby] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('restaurant');
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'search' | 'nearby' | 'saved' | 'directions'>('search');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const categories = [
    { id: 'restaurant', name: 'Restaurants', icon: Utensils, color: '#ef4444' },
    { id: 'cafe', name: 'Cafes', icon: Coffee, color: '#f59e0b' },
    { id: 'shopping_mall', name: 'Shopping', icon: ShoppingBag, color: '#8b5cf6' },
    { id: 'hotel', name: 'Hotels', icon: Hotel, color: '#3b82f6' },
    { id: 'hospital', name: 'Hospitals', icon: Hospital, color: '#10b981' },
  ];

  useEffect(() => {
    getCurrentLocation();
    loadSavedPlaces();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      updateMap();
    }
  }, [currentLocation, destination, travelMode, mapType, zoomLevel, markers]);

  const loadSavedPlaces = () => {
    const saved = localStorage.getItem('savedPlaces');
    if (saved) {
      setSavedPlaces(JSON.parse(saved));
    }
  };

  const savePlaceToLocal = (place: Omit<SavedPlace, 'id' | 'timestamp'>) => {
    const newPlace: SavedPlace = {
      ...place,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    const updated = [...savedPlaces, newPlace];
    setSavedPlaces(updated);
    localStorage.setItem('savedPlaces', JSON.stringify(updated));
  };

  const deleteSavedPlace = (id: string) => {
    const updated = savedPlaces.filter(p => p.id !== id);
    setSavedPlaces(updated);
    localStorage.setItem('savedPlaces', JSON.stringify(updated));
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setIsLoading(false);
        },
        () => {
          // Fallback to default location
          const location = { lat: 28.6139, lng: 77.2090 };
          setCurrentLocation(location);
          setIsLoading(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const updateMap = () => {
    if (!currentLocation) return;

    let url = '';

    if (showDirections && destination) {
      // Directions mode
      const mode = travelMode === 'driving' ? 'd' :
        travelMode === 'walking' ? 'w' :
          travelMode === 'transit' ? 'r' : 'b';

      url = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}`;

      // Calculate approximate distance and time (this is simplified)
      const dist = calculateDistance(currentLocation, destination);
      setDistance(`${dist.toFixed(1)} km`);

      const time = estimateTime(dist, travelMode);
      setDuration(time);
    } else {
      // Regular map or search mode
      const center = destination || currentLocation;
      const mapTypeParam = mapType;

      // Build markers string
      let markersParam = '';
      markers.forEach((marker, index) => {
        markersParam += `&markers=color:red%7Clabel:${marker.label}%7C${marker.lat},${marker.lng}`;
      });

      url = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${center.lat},${center.lng}&zoom=${zoomLevel}&maptype=${mapTypeParam}${markersParam}`;
    }

    setMapUrl(url);
  };

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimateTime = (distance: number, mode: string): string => {
    let speed = 50; // km/h for driving
    if (mode === 'walking') speed = 5;
    else if (mode === 'bicycling') speed = 15;
    else if (mode === 'transit') speed = 30;

    const hours = distance / speed;
    const mins = Math.round(hours * 60);

    if (mins < 60) return `${mins} mins`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    // Using Google Geocoding API (simplified - in production use proper API)
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const location = data.results[0].geometry.location;
        setDestination({ lat: location.lat, lng: location.lng });
        setActiveTab('search');
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const searchNearbyPlaces = async (category: string) => {
    if (!currentLocation) return;

    setSelectedCategory(category);
    setShowNearby(true);

    // Using Google Places API (simplified)
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${currentLocation.lat},${currentLocation.lng}&radius=2000&type=${category}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`
      );
      const data = await response.json();

      if (data.results) {
        setNearbyPlaces(data.results.slice(0, 10));
        setActiveTab('nearby');
      }
    } catch (error) {
      console.error('Nearby search failed:', error);
      // Fallback: show some dummy data
      setNearbyPlaces([
        {
          name: 'Sample Place 1',
          vicinity: 'Near you',
          rating: 4.5,
          geometry: { location: { lat: currentLocation.lat + 0.01, lng: currentLocation.lng + 0.01 } }
        }
      ]);
    }
  };

  const addMarker = () => {
    if (!currentLocation) return;

    const newMarker = {
      lat: currentLocation.lat + (Math.random() - 0.5) * 0.01,
      lng: currentLocation.lng + (Math.random() - 0.5) * 0.01,
      label: String.fromCharCode(65 + markers.length) // A, B, C...
    };

    setMarkers([...markers, newMarker]);
  };

  const shareLocation = () => {
    if (!currentLocation) return;

    const url = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;

    if (navigator.share) {
      navigator.share({
        title: 'My Location',
        text: 'Check out this location!',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Location link copied to clipboard!');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={getCurrentLocation}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Navigation size={18} />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => searchNearbyPlaces(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${selectedCategory === cat.id && showNearby
                    ? 'text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                style={{
                  backgroundColor: selectedCategory === cat.id && showNearby ? cat.color : undefined
                }}
              >
                <Icon size={16} />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 flex-shrink-0">
            {[
              { id: 'search', label: 'Search', icon: Search },
              { id: 'nearby', label: 'Nearby', icon: MapPin },
              { id: 'directions', label: 'Directions', icon: Route },
              { id: 'saved', label: 'Saved', icon: Bookmark },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Location
                  </label>
                  {currentLocation && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm">
                      <div className="font-medium text-blue-900">Your Location</div>
                      <div className="text-blue-700 text-xs mt-1">
                        {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Map Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['roadmap', 'satellite', 'hybrid', 'terrain'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setMapType(type as any)}
                        className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${mapType === type
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoom Level: {zoomLevel}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={zoomLevel}
                      onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <button
                      onClick={() => setZoomLevel(Math.min(20, zoomLevel + 1))}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    onClick={addMarker}
                    className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin size={16} />
                    Add Marker ({markers.length})
                  </button>
                  {markers.length > 0 && (
                    <button
                      onClick={() => setMarkers([])}
                      className="w-full mt-2 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      Clear All Markers
                    </button>
                  )}
                </div>

                <button
                  onClick={shareLocation}
                  className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={16} />
                  Share Location
                </button>
              </div>
            )}

            {/* Nearby Tab */}
            {activeTab === 'nearby' && (
              <div className="space-y-3">
                {nearbyPlaces.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MapPin className="mx-auto mb-2" size={32} />
                    <p>Select a category to find nearby places</p>
                  </div>
                ) : (
                  nearbyPlaces.map((place, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => {
                        setDestination({
                          lat: place.geometry.location.lat,
                          lng: place.geometry.location.lng
                        });
                        setShowNearby(false);
                      }}
                    >
                      <div className="font-medium text-gray-900">{place.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{place.vicinity}</div>
                      {place.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star size={14} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">{place.rating}</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          savePlaceToLocal({
                            name: place.name,
                            address: place.vicinity,
                            location: {
                              lat: place.geometry.location.lat,
                              lng: place.geometry.location.lng
                            },
                            category: selectedCategory
                          });
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Save size={14} />
                        Save Place
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Directions Tab */}
            {activeTab === 'directions' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    placeholder="Enter destination..."
                    value={destQuery}
                    onChange={(e) => setDestQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        searchLocation();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'driving', icon: Car, label: 'Driving' },
                      { id: 'walking', icon: Navigation, label: 'Walking' },
                      { id: 'transit', icon: Train, label: 'Transit' },
                      { id: 'bicycling', icon: Bike, label: 'Cycling' },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setTravelMode(mode.id as any)}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${travelMode === mode.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          <Icon size={16} />
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {destination && (
                  <button
                    onClick={() => setShowDirections(!showDirections)}
                    className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {showDirections ? 'Hide Directions' : 'Show Directions'}
                  </button>
                )}

                {showDirections && distance && duration && (
                  <div className="p-4 bg-green-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Distance</span>
                      <span className="font-medium text-gray-900">{distance}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="font-medium text-gray-900">{duration}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div className="space-y-3">
                {savedPlaces.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Bookmark className="mx-auto mb-2" size={32} />
                    <p>No saved places yet</p>
                  </div>
                ) : (
                  savedPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{place.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{place.address}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(place.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSavedPlace(place.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setDestination(place.location);
                          setActiveTab('search');
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        View on Map
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-2 text-blue-500" size={32} />
                <p className="text-gray-700">Loading map...</p>
              </div>
            </div>
          )}
          {mapUrl && (
            <iframe
              ref={iframeRef}
              src={mapUrl}
              className="w-full h-full border-0"
              title="Google Maps"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdvancedMaps;