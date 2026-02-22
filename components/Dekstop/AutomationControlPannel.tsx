"use client"

import React, { useState } from 'react';
import { CursorAutomationAPI } from './useCursorAutomation';
import { useElevenTTS } from '@/hooks/ElevenLabs';
import { scale } from 'framer-motion';

interface AutomationControlPanelProps {
    automationAPI: CursorAutomationAPI;
    openWindows: any[];
}

export function AutomationControlPanel({
    automationAPI,
    openWindows
}: AutomationControlPanelProps) {
    const [commandInput, setCommandInput] = React.useState('');
    const [statusMessage, setStatusMessage] = React.useState('Ready');
    const [isExecuting, setIsExecuting] = React.useState(false);
    const [logs, setLogs] = React.useState<Array<{ message: string; type: string; timestamp: string }>>([]);
    const [isOpen, setIsOpen] = useState(false); // <-- Panel toggle

    const { speak } = useElevenTTS();

    const updateStatus = (message: string) => setStatusMessage(message);

    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-19), { message, type, timestamp }]);
    };

    // --- Execute command logic ---
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

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeCommand();
        }
    };

    // Quick actions example
    const quickActions = [
        { label: 'Open Terminal', command: 'open terminal' },
        { label: 'Open Settings', command: 'open settings' },
        { label: 'Open Browser', command: 'open chrome' }
    ];

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    style={{ transform: 'scale(2)' }}
                    onClick={() => setIsOpen(true)}
                    className=" z-[9999] w-6 h-4 rounded-full  text-white flex items-center justify-center shadow-2xl transition-all"
                    title="Open Automation Panel"
                >
                    🐞
                </button>
            )}

            {/* Panel */}
            {isOpen && (
                <div className="absolute top-4 right-4 z-[9999] w-96 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                    {/* Close Button */}
                    <div className="flex justify-start  p-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className=" h-6 w-6  hover:bg-red-700 text-white rounded-full text-xs"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Command Input */}
                    <div className="p-4 border-b border-white/10">
                        <label className="text-white/70 text-xs block mb-2">Text Command</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={commandInput}
                                onChange={(e) => setCommandInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="e.g., open Terminal"
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
                                    onClick={() => action.command && setCommandInput(action.command)}
                                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="p-4 overflow-y-auto flex-1">
                        <div className="text-xs text-white/60 mb-2">Activity Log</div>
                        <div className="bg-black/40 rounded-lg p-2 max-h-full overflow-y-auto text-xs font-mono">
                            {logs.length === 0 ? (
                                <div className="text-white/40 italic">No activity yet</div>
                            ) : (
                                logs.map((log, idx) => (
                                    <div key={idx} className={`mb-1 ${log.type === 'success' ? 'text-green-400' : log.type === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
                                        <span className="text-white/50">[{log.timestamp}]</span> {log.message}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
