"use client"

import React, { useState, useEffect } from 'react';
import { CursorAutomationAPI } from './useCursorAutomation';
import { useElevenTTS } from '@/hooks/ElevenLabs';

interface AutomationControlPanelProps {
    automationAPI: CursorAutomationAPI;
    openWindows: any[];
}

export function AutomationControlPanel({
    automationAPI,
    openWindows
}: AutomationControlPanelProps) {
    const [commandInput, setCommandInput] = useState('');
    const [statusMessage, setStatusMessage] = useState('Ready');
    const [isExecuting, setIsExecuting] = useState(false);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [logs, setLogs] = useState<Array<{ message: string; type: string; timestamp: string }>>([]);

    const { speak } = useElevenTTS()

    // Update status message
    const updateStatus = (message: string) => {
        setStatusMessage(message);
    };

    // Add log entry
    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-19), { message, type, timestamp }]);
    };

    // Execute text command
    const executeCommand = async () => {
        if (!commandInput.trim()) return;

        setIsExecuting(true);
        updateStatus(`Executing: ${commandInput}`);
        addLog(`Executing: ${commandInput}`, 'info');

        try {
            const success = await automationAPI.executeTextCommand(commandInput);

            if (success) {
               
                updateStatus(`✓ Success: ${commandInput}`);
                addLog(`✓ Command executed successfully`, 'success');

                setCommandHistory(prev => [...prev, commandInput]);
            } else {
                updateStatus(`✗ Failed: ${commandInput}`);
                addLog(`✗ Command failed`, 'error');
            }
        } catch (error) {
            updateStatus(`✗ Error: ${error}`);
            addLog(`✗ Error: ${error}`, 'error');
        } finally {
            setIsExecuting(false);
            setCommandInput('');
        }
    };

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeCommand();
        }
    };

    // Quick actions
    const quickActions = [
        {
            label: 'Open Terminal',
            command: 'open terminal'
        },
        {
            label: 'Open Settings',
            command: 'open settings'
        },
        {
            label: 'Open Browser',
            command: 'open chrome'
        },
        {
            label: 'Type Wallpaper URL',
            command: 'type into wallpaper "https://images.unsplash.com/photo-...'
        },
        {
            label: 'List Windows',
            action: () => {
                const windows = automationAPI.getAllWindows();
                addLog(`Open windows: ${windows.join(', ') || 'None'}`, 'info');
                updateStatus(`${windows.length} window(s) open`);
            }
        },
        {
            label: 'Close All',
            action: async () => {
                const windows = automationAPI.getAllWindows();
                updateStatus(`Closing ${windows.length} window(s)...`);
                for (const id of windows) {
                    await automationAPI.closeWindow(id);
                    await new Promise(r => setTimeout(r, 200));
                }
                updateStatus('All windows closed');
            }
        }
    ];

    return (
        <div className="fixed top-4 right-4 w-96 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-[9999] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    Automation Control
                </h3>
            </div>

            {/* Command Input */}
            <div className="p-4 border-b border-white/10">
                <label className="text-white/70 text-xs block mb-2">
                    Text Command
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="e.g., open Terminal, close window-123..."
                        className="flex-1 bg-white/10 text-white px-3 py-2 rounded-lg text-sm border border-white/20 focus:outline-none focus:border-purple-500 transition-colors"
                        disabled={isExecuting}
                    />
                    <button
                        onClick={executeCommand}
                        disabled={isExecuting || !commandInput.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        {isExecuting ? '⏳' : '▶'}
                    </button>
                </div>
            </div>

            {/* Status */}
            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="text-xs text-white/60">Status:</div>
                <div className="text-sm text-white/90 truncate">{statusMessage}</div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-white/10">
                <div className="text-xs text-white/60 mb-2">Quick Actions</div>
                <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (action.command) {
                                    setCommandInput(action.command);
                                } else if (action.action) {
                                    action.action();
                                }
                            }}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Open Windows List */}
            <div className="p-4 border-b border-white/10">
                <div className="text-xs text-white/60 mb-2">
                    Open Windows ({openWindows.length})
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                    {openWindows.length === 0 ? (
                        <div className="text-xs text-white/40 italic">No windows open</div>
                    ) : (
                        openWindows.map(window => (
                            <div
                                key={window.id}
                                className="flex items-center justify-between bg-white/5 px-2 py-1 rounded text-xs"
                            >
                                <span className="text-white/80 truncate flex-1">
                                    {window.title}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => automationAPI.focusWindow(window.id)}
                                        className="px-2 py-1 bg-blue-600/50 hover:bg-blue-600 rounded text-white/90 transition-colors"
                                        title="Focus"
                                    >
                                        👁
                                    </button>
                                    <button
                                        onClick={() => automationAPI.closeWindow(window.id)}
                                        className="px-2 py-1 bg-red-600/50 hover:bg-red-600 rounded text-white/90 transition-colors"
                                        title="Close"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Activity Log */}
            <div className="p-4">
                <div className="text-xs text-white/60 mb-2">Activity Log</div>
                <div className="bg-black/40 rounded-lg p-2 max-h-40 overflow-y-auto text-xs font-mono">
                    {logs.length === 0 ? (
                        <div className="text-white/40 italic">No activity yet</div>
                    ) : (
                        logs.map((log, idx) => (
                            <div
                                key={idx}
                                className={`mb-1 ${log.type === 'success' ? 'text-green-400' :
                                    log.type === 'error' ? 'text-red-400' :
                                        'text-blue-400'
                                    }`}
                            >
                                <span className="text-white/50">[{log.timestamp}]</span> {log.message}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Command Help */}
            <div className="px-4 py-3 bg-white/5 text-xs text-white/50">
                <details>
                    <summary className="cursor-pointer hover:text-white/70">
                        Command Help
                    </summary>
                    <div className="mt-2 space-y-1 text-white/60">
                        <div>• <code>open [app]</code> - Open application</div>
                        <div>• <code>close [windowId]</code> - Close window</div>
                        <div>• <code>minimize [windowId]</code> - Minimize window</div>
                        <div>• <code>maximize [windowId]</code> - Maximize window</div>
                        <div>• <code>focus [windowId]</code> - Focus window</div>
                        <div>• <code>click [elementId]</code> - Click element</div>
                        <div>• <code>move to [elementId]</code> - Move to element</div>
                        <div>• <code>type into [elementId] "[text]"</code> - Type text into input</div>
                    </div>
                </details>
            </div>
        </div>
    );
}