"use client"

import { useVoiceAutomation } from '@/hooks/useDekstopAgent';
import React from 'react';

interface VoiceControlButtonProps {
    openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
    openWindows: any[];
    setOpenWindows: React.Dispatch<React.SetStateAction<any[]>>;
}

export function VoiceControlButton({
    openApplication,
    openWindows,
    setOpenWindows
}: VoiceControlButtonProps) {
    const {
        callStatus,
        lastTranscript,
        isSpeaking,
        executionLog,
        startCall,
        endCall,
        isActive
    } = useVoiceAutomation({
        openApplication,
        openWindows,
        setOpenWindows
    });

    const [showLog, setShowLog] = React.useState(false);

    return (
        <>
            {/* Voice Control Button */}
            <button
                onClick={isActive ? endCall : startCall}
                className={`fixed  bottom-26 sm:bottom-8 right-8 w-4 h-4 rounded-full shadow-2xl transition-all duration-300 z-[9998] flex items-center justify-center ${isActive
                    ? 'bg-red-600 hover:bg-red-700 scale-110'
                    : 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    }`}
                title={isActive ? "End Voice Control" : "Start Voice Control"}
            >
                {/* Pulsing animation when active */}
                {isActive && (
                    <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
                )}

                {/* Icon */}
                <div className="relative z-10">
                    {isActive ? (
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                        </svg>
                    )}
                </div>
            </button>

            {/* Show Log Button (when active) */}
            {isActive && (
                <button
                    onClick={() => setShowLog(!showLog)}
                    className="fixed bottom-8 right-28 px-4 py-2 bg-black/70 hover:bg-black/90 text-white text-sm rounded-lg backdrop-blur-sm transition-all z-[9998]"
                >
                    {showLog ? 'Hide' : 'Show'} Log
                </button>
            )}

            {/* Activity Log Panel */}
            {showLog && isActive && (
                <div className="fixed bottom-28 right-8 w-96 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-[9998] overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center justify-between">
                        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                            <span className="text-lg">🎤</span>
                            Voice Activity
                        </h3>
                        <button
                            onClick={() => setShowLog(false)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Status */}
                    <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                            <span className="text-white/70 text-xs">
                                {isSpeaking ? 'Assistant speaking...' : 'Listening...'}
                            </span>
                        </div>
                        {lastTranscript && (
                            <div className="mt-2 text-white/90 text-sm">
                                "{lastTranscript}"
                            </div>
                        )}
                    </div>

                    {/* Execution Log */}
                    <div className="p-4">
                        <div className="text-xs text-white/60 mb-2">Execution Log</div>
                        <div className="bg-black/40 rounded-lg p-3 max-h-64 overflow-y-auto text-xs font-mono">
                            {executionLog.length === 0 ? (
                                <div className="text-white/40 italic">
                                    Say "change wallpaper" or "open terminal"
                                </div>
                            ) : (
                                executionLog.map((log, idx) => (
                                    <div key={idx} className="mb-1 text-white/80">
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Commands */}
                    <div className="px-4 py-3 bg-white/5 text-xs text-white/50">
                        <details>
                            <summary className="cursor-pointer hover:text-white/70">
                                📖 Example Commands
                            </summary>
                            <div className="mt-2 space-y-1 text-white/60">
                                <div>• "Change wallpaper to mountains"</div>
                                <div>• "Toggle dark mode"</div>
                                <div>• "Open terminal"</div>
                                <div>• "Search YouTube for music"</div>
                                <div>• "Close all windows"</div>
                                <div>• "Change folder color to purple"</div>
                            </div>
                        </details>
                    </div>
                </div>
            )}

            {/* Status Indicator (floating) */}
            {isActive && (
                <div className="fixed bottom-28 right-8 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs flex items-center gap-2 z-[9997]">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Voice Active
                </div>
            )}
        </>
    );
}

/**
 * USAGE in Desktop.tsx:
 * 
 * import { VoiceControlButton } from './VoiceControlButton';
 * 
 * function Desktop() {
 *   return (
 *     <div>
 *       {/* Your desktop content *\/}
 *       
 *       <VoiceControlButton 
 *         openApplication={openApplication}
 *         openWindows={openWindows}
 *         setOpenWindows={setOpenWindows}
 *       />
 *     </div>
 *   );
 * }
 */