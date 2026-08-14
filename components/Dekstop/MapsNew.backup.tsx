'use client'

import React, { useState } from "react";
import { useAppStore } from "@/lib/store/macGalleryStore";
import { 
  Search, MapPin, Pin, BookOpen, Route, Clock, Star, Navigation, 
  Plus, Minus, CloudSun, Compass, Landmark, Compass as CompassIcon,
  Tent, ChevronRight
} from "lucide-react";

// Traffic lights component inside Maps Sidebar
const TrafficLights = ({ windowId }: { windowId: string }) => {
  const close = useAppStore((s) => s.closeApp);
  const minimize = useAppStore((s) => s.minimizeApp);
  const toggleMaximize = useAppStore((s) => s.toggleMaximize);
  const windows = useAppStore((s) => s.windows);
  const win = windows.find(w => w.id === windowId);
  const maximized = win ? win.maximized : false;

  return (
    <div className="flex items-center gap-2 group shrink-0">
      <div
        className="w-3 h-3 bg-[#ff5f57] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#ff4136] transition-all duration-150 shadow-sm"
        onClick={() => close(windowId)}
        title="Close"
      >
        <svg className="w-1.5 h-1.5 text-[#820005] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 10">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div
        className="w-3 h-3 bg-[#febc2e] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#ff9500] transition-all duration-150 shadow-sm"
        onClick={() => minimize(windowId)}
        title="Minimize"
      >
        <svg className="w-1.5 h-1.5 text-[#9a6400] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 10">
          <path d="M1 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div
        className="w-3 h-3 bg-[#28c840] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#1aab29] transition-all duration-150 shadow-sm"
        onClick={() => toggleMaximize(windowId)}
        title={maximized ? "Restore" : "Maximize"}
      >
        <svg className="w-1.5 h-1.5 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 10">
          {maximized ? (
            <>
              <rect x="1.5" y="3.5" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3.5 3.5V1.5H8.5V6.5H6.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            </>
          ) : (
            <>
              <path d="M1 1L4 4M1 1V3.5M1 1H3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M9 9L6 6M9 9V6.5M9 9H6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

interface LocationData {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  website?: string;
  lat: number;
  lon: number;
  bbox: string;
  icon: JSX.Element;
}

export default function MapsNew({ windowId }: { windowId?: string }) {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [activePresetId, setActivePresetId] = useState("eiffel");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [is3D, setIs3D] = useState(false);

  // Mock Preset Locations
  const presets: LocationData[] = [
    {
      id: "eiffel",
      name: "Eiffel tower",
      category: "Tourist Attraction",
      address: "5 Avenue Anatole France, Paris, France",
      phone: "+33 892 70 12 39",
      website: "toureiffel.paris",
      lat: 48.8584,
      lon: 2.2945,
      bbox: "2.2845%2C48.8500%2C2.3045%2C48.8680",
      icon: <Star size={14} className="text-white fill-white" />
    },
    {
      id: "goldengate",
      name: "Golden Gate Bridge",
      category: "Bridge / Landmark",
      address: "Golden Gate Bridge, San Francisco, CA, USA",
      phone: "+1 (415) 921-5858",
      website: "goldengate.org",
      lat: 37.8199,
      lon: -122.4783,
      bbox: "-122.490%2C37.812%2C-122.466%2C37.827",
      icon: <Landmark size={14} className="text-white fill-white" />
    }
  ];

  const allLocations = [...presets, ...searchResults];
  const currentPreset = allLocations.find(p => p.id === activePresetId) || allLocations[0];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const query = searchQuery.toLowerCase();
    
    // First, check if it matches existing presets or search results
    const match = allLocations.find(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
    if (match) {
      setActivePresetId(match.id);
      return;
    }

    // Otherwise, fetch from Nominatim OpenStreetMap API
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        // Nominatim bbox: [latMin, latMax, lonMin, lonMax]
        const latMin = parseFloat(result.boundingbox[0]);
        const latMax = parseFloat(result.boundingbox[1]);
        const lonMin = parseFloat(result.boundingbox[2]);
        const lonMax = parseFloat(result.boundingbox[3]);
        
        // OSM Embed bbox: left,bottom,right,top (lonMin, latMin, lonMax, latMax)
        const bbox = `${lonMin}%2C${latMin}%2C${lonMax}%2C${latMax}`;
        
        const newLoc: LocationData = {
          id: `search-${Date.now()}`,
          name: searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1),
          category: "Search Result",
          address: result.display_name,
          lat,
          lon,
          bbox,
          icon: <MapPin size={14} className="text-white fill-white" />
        };
        
        setSearchResults(prev => [newLoc, ...prev]);
        setActivePresetId(newLoc.id);
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  // Map URL builder: OSM for 2D, F4Map Demo for interactive 3D view
  const mapUrl = is3D 
    ? `https://demo.f4map.com/#lat=${currentPreset.lat}&lon=${currentPreset.lon}&zoom=18`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${currentPreset.bbox}&layer=mapnik&marker=${currentPreset.lat}%2C${currentPreset.lon}`;

  return (
    <div 
      className={`maps-container w-full h-full select-none text-[13px] rounded-xl overflow-hidden font-sans relative ${
        isDarkMode ? "bg-[#1E1E1E] text-white" : "bg-white text-gray-800"
      }`}
    >
      
      {/* 1. Main Background Map Viewport */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <iframe
          src={mapUrl}
          className={`absolute border-none transition-all duration-500 ease-out ${
            is3D 
              ? "w-[calc(100%+320px)] h-[calc(100%+160px)] -top-[80px] -left-[240px]" 
              : "w-full h-full top-0 left-0"
          }`}
          title="Apple Maps Viewport"
        />
      </div>

      {/* 2. Floating Sidebar Panel */}
      {isSidebarOpen && (
        <aside className={`absolute left-5 top-5 bottom-5 w-[260px] z-10 flex flex-col rounded-3xl border shadow-[0_12px_40px_rgba(0,0,0,0.18)] ${
          isDarkMode 
            ? "border-white/10 bg-[#1E201E]/75 backdrop-blur-xl text-white" 
            : "border-black/5 bg-[#f4f7f4]/75 backdrop-blur-xl text-gray-900"
        } transition-all duration-300`}>
          
          {/* Header */}
          <div className="window-drag-handle p-4 pb-2 shrink-0 flex items-center justify-between">
            {windowId && <TrafficLights windowId={windowId} />}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className={`p-1.5 rounded-lg transition ${isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-black/5 text-gray-600"}`}
              title="Hide Sidebar"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="currentcolor">
                <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="5.5" y1="1.5" x2="5.5" y2="14.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
          </div>

          {/* Search bar */}
          <div className="px-4 pb-3 shrink-0">
            <form onSubmit={handleSearch} className="relative">
              <div className={`flex items-center rounded-xl px-3 py-1.5 border transition-all duration-200 ${
                isDarkMode 
                  ? "bg-black/25 border-white/5 text-gray-300 focus-within:border-blue-500/50" 
                  : "bg-black/[0.04] border-black/5 text-gray-800 focus-within:bg-white focus-within:border-blue-500/30 shadow-xs"
              }`}>
                <Search size={14} className="text-gray-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search Maps"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-[12.5px] outline-none placeholder-gray-400 text-inherit"
                />
              </div>
            </form>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto notes-no-scrollbar px-3 space-y-4" style={{ scrollbarWidth: "none" }}>
            
            {/* Places Section */}
            <div className="space-y-0.5">
              <div className="px-2 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">Places</div>
              <div className="space-y-0.5 text-[13px]">
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <Pin size={15} className="text-gray-500 dark:text-gray-400 rotate-45" />
                  <span className="font-medium">Pinned</span>
                </div>
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <MapPin size={15} className="text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">Saved Places</span>
                </div>
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <BookOpen size={15} className="text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">Guides</span>
                </div>
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <Route size={15} className="text-gray-500 dark:text-gray-400"/>
                  <span className="font-medium">Routes</span>
                </div>
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <Clock size={15} className="text-gray-500 dark:text-gray-400"/>
                  <span className="font-medium">Recently Added</span>
                </div>
              </div>
            </div>

            {/* Recents Section */}
            <div className="space-y-0.5">
              <div className="px-2 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">Recents</div>
              <div className="space-y-0.5">
                {allLocations.map(p => {
                  const isSelected = activePresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActivePresetId(p.id)}
                      className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                        isSelected 
                          ? "bg-blue-500/10 dark:bg-blue-500/20" 
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#007AFF] text-white">
                        {p.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[13px] truncate">{p.name}</h3>
                        <p className="text-[10.5px] text-gray-400 dark:text-gray-500 truncate">{p.address.split(",")[0]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={() => {
                  setSearchResults([]);
                  setActivePresetId("eiffel");
                }}
                className="px-2 py-1 text-[11.5px] text-[#007AFF] hover:underline mt-1 block font-medium"
              >
                Clear Recents
              </button>
            </div>

          </div>

          {/* Terms & Conditions Footer Link */}
          <div className="px-5 py-4 shrink-0 flex items-center justify-start mt-auto">
            <button className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition font-medium">
              Terms & Conditions ›
            </button>
          </div>

        </aside>
      )}

      {/* Toggle Sidebar Button when sidebar is hidden */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`absolute left-5 top-5 w-8 h-8 rounded-full z-20 flex items-center justify-center border shadow-md transition ${
            isDarkMode 
              ? "bg-[#1E1E1E] border-white/10 text-white hover:bg-white/[0.08]" 
              : "bg-white border-black/5 text-gray-800 hover:bg-black/[0.04]"
          }`}
          title="Show Sidebar"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="currentcolor">
            <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="5.5" y1="1.5" x2="5.5" y2="14.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </button>
      )}

      {/* 3. Top Center: Scale Widget */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-end justify-center pointer-events-none select-none">
        <div className="flex flex-col items-center">
          <div className="flex gap-4 text-[9px] text-black font-semibold tracking-wide dark:text-white leading-none">
            <span>0</span>
            <span>2.5</span>
            <span>5 km</span>
          </div>
          {/* Scale line */}
          <svg width="60" height="6" viewBox="0 0 60 6" fill="none" className="mt-1">
            <line x1="0" y1="3" x2="60" y2="3" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="0.6" y1="0" x2="0.6" y2="6" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="30" y1="0" x2="30" y2="6" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="59.4" y1="0" x2="59.4" y2="6" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </div>
      </div>

      {/* 4. Top Right: Floating Maps Utility Controls */}
      <div className="absolute top-5 right-5 flex flex-col gap-2.5 z-10 pointer-events-auto items-center">
        {/* Landmark campsite icon */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] text-[#D08B00] shadow-md border border-black/5 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
          <Tent size={14} className="fill-[#D08B00]/20" />
        </button>
        
        {/* 3D Toggle */}
        <button 
          onClick={() => setIs3D(!is3D)}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border transition ${
            is3D 
              ? "bg-blue-500 text-white border-blue-500" 
              : "bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 border-black/5 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          }`}
          title={is3D ? "Switch to 2D" : "Switch to 3D"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <path d="M8 2L2 5L8 8L14 5L8 2Z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 9L8 12L14 9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11L8 14L14 11" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Zoom In */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 shadow-md border border-black/5 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
          <Plus size={14} />
        </button>

        {/* Zoom Out */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 shadow-md border border-black/5 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
          <Minus size={14} />
        </button>

        {/* Compass */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] text-[#007AFF] shadow-md border border-black/5 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
          <Compass size={16} />
        </button>

        {/* Current Location */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#2C2C2E] text-[#007AFF] shadow-md border border-black/5 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
          <Navigation size={14} className="fill-[#007AFF]" />
        </button>
      </div>

      {/* 5. Bottom Center: Attribution */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
        <div className={`text-[10px] font-medium px-2 py-1 rounded backdrop-blur-sm ${
          isDarkMode ? "bg-black/50 text-white" : "bg-white/75 text-gray-700"
        }`}>
          © OpenStreetMap contributors
        </div>
      </div>
      
    </div>
  );
}
