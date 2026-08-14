"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WebpageCropper from './WebpageCropper';

interface WidgetCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  onCreateLive: (url: string, title: string) => void;
  onCreateSnapshot: (url: string, title: string, croppedImage: string) => void;
  isDarkMode: boolean;
}

export default function WidgetCreationModal({
  isOpen,
  onClose,
  url,
  title,
  onCreateLive,
  onCreateSnapshot,
  isDarkMode
}: WidgetCreationModalProps) {
  const [selectedType, setSelectedType] = useState<'live' | 'snapshot' | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (selectedType === 'snapshot') {
      // Open the cropper for snapshot
      setShowCropper(true);
    } else if (selectedType === 'live') {
      // Open the cropper for live widget too (to select area)
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedImage: string, title: string, sourceUrl: string) => {
    if (selectedType === 'live') {
      // For live widgets, create a live widget with specific URL (we'll add zoom/pan later)
      onCreateLive(sourceUrl, title);
    } else {
      // For snapshots, create snapshot widget with cropped image
      onCreateSnapshot(sourceUrl, title, croppedImage);
    }
    setShowCropper(false);
    onClose();
    setSelectedType(null);
  };

  const bgColor = isDarkMode ? 'bg-black/80' : 'bg-white/80';
  const cardBg = isDarkMode 
    ? 'bg-gradient-to-b from-gray-900/95 to-black/90 border-white/10' 
    : 'bg-gradient-to-b from-white/95 to-gray-50/90 border-black/10';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const mutedText = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const buttonActive = 'bg-purple-600 border-purple-500';
  const buttonInactive = isDarkMode 
    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
    : 'bg-black/5 border-black/10 hover:bg-black/10';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - z-index below cursor (2147483640) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[2147483638] ${bgColor} backdrop-blur-xl`}
              onClick={onClose}
            />

            {/* Modal - z-index below cursor but above backdrop */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2147483640] w-full max-w-lg ${cardBg} backdrop-blur-2xl rounded-2xl border shadow-2xl overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-5 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                <h2 className={`text-xl font-semibold ${textColor}`}>Create Desktop Widget</h2>
                <p className={`text-sm mt-1 ${mutedText}`}>
                  {title || 'Untitled'} • {url.replace('https://', '').split('/')[0]}
                </p>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Live Web Widget Option */}
                <button
                  onClick={() => setSelectedType('live')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedType === 'live' ? buttonActive : buttonInactive
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedType === 'live' 
                        ? 'bg-purple-600/30' 
                        : isDarkMode ? 'bg-white/10' : 'bg-black/5'
                    }`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={textColor}>
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className={`font-medium ${textColor}`}>Live Web Widget</div>
                      <div className={`text-xs mt-1 ${mutedText}`}>
                        Displays live webpage in a resizable widget. Best for dashboards, news, weather.
                      </div>
                      {selectedType === 'live' && (
                        <div className={`text-xs mt-2 text-purple-400`}>
                          ✓ Real-time updates • Interactive
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Snapshot Widget Option */}
                <button
                  onClick={() => setSelectedType('snapshot')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedType === 'snapshot' ? buttonActive : buttonInactive
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedType === 'snapshot' 
                        ? 'bg-purple-600/30' 
                        : isDarkMode ? 'bg-white/10' : 'bg-black/5'
                    }`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={textColor}>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className={`font-medium ${textColor}`}>Snapshot Widget</div>
                      <div className={`text-xs mt-1 ${mutedText}`}>
                        Select and crop a region of the webpage. Works with all websites.
                      </div>
                      {selectedType === 'snapshot' && (
                        <div className={`text-xs mt-2 text-purple-400`}>
                          ✓ Works everywhere • Resizable
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Info Box */}
                {selectedType === 'live' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg ${isDarkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}
                  >
                    <div className={`text-xs ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                      ⚠️ Some websites (YouTube, social media) block live embedding. If embedding fails, you'll be prompted to create a snapshot instead.
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className={`p-5 border-t flex justify-end gap-3 ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                <button
                  onClick={() => {
                    onClose();
                    setSelectedType(null);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-gray-900'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!selectedType}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    selectedType
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedType ? 'Select Area' : 'Create Widget'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cropper Modal */}
      <WebpageCropper
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        url={url}
        title={title}
        onCropComplete={handleCropComplete}
        isDarkMode={isDarkMode}
      />
    </>
  );
}
