/**
 * FileSearchProgress V2 - Production Queue-Based UI
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. Subscribes to orchestrator state (NEVER awaits)
 * 2. Renders ranked results list (not just first result)
 * 3. Includes "Move to Smarty Finder" action
 * 4. DEV: Auto-grant permission (bypass TCC for testing)
 * 5. PROD: Wait for real TCC dialog
 */

import React, { useEffect, useState } from 'react';
import { Window } from '@/components/Dekstop/window';
import { useSettings } from '@/app/context/settingContext';

interface SearchResult {
  path: string;
  name: string;
  size?: number;
  modifiedAt?: string;
  score?: number;
  extension?: string;
  description?: string;
}

interface SearchStep {
  id: string;
  location: 'Desktop' | 'Documents' | 'Downloads' | 'Home';
  status: 'pending' | 'requesting_permission' | 'searching' | 'found' | 'not_found' | 'denied' | 'error';
  permissionGranted: boolean | null;
  results?: SearchResult[];
  humanLog: string;
}

interface FileSearchOperation {
  id: string;
  filename: string;
  steps: SearchStep[];
  currentStepIndex: number;
  status: 'pending' | 'running' | 'awaiting_permission' | 'results_ready' | 'moving_file' | 'completed' | 'cancelled' | 'not_found' | 'denied' | 'error';
  startedAt: number;
  completedAt?: number;
  foundFile?: SearchResult;
  allResults?: SearchResult[];
}

interface OrchestratorState {
  queue: FileSearchOperation[];
  currentOperation: FileSearchOperation | null;
  isProcessing: boolean;
  version: string;
}

interface FileSearchProgressProps {
  onGrantPermission: (operationId: string) => void;
  onDenyPermission: (operationId: string) => void;
  onCancel: (operationId: string) => void;
  onSelectFile: (operationId: string, filePath: string) => void;
}

// Step status icons
const getStatusIcon = (status: SearchStep['status']): string => {
  switch (status) {
    case 'pending': return '⏳';
    case 'requesting_permission': return '🔐';
    case 'searching': return '🔍';
    case 'found': return '✅';
    case 'not_found': return '❌';
    case 'denied': return '⛔';
    case 'error': return '⚠️';
    default: return '❓';
  }
};

// Step status colors
const getStatusColor = (status: SearchStep['status'], isDark: boolean): string => {
  switch (status) {
    case 'pending': return isDark ? '#888' : '#999';
    case 'requesting_permission': return '#ffcc00';
    case 'searching': return '#0b79ff';
    case 'found': return '#34c759';
    case 'not_found': return isDark ? '#666' : '#888';
    case 'denied': return '#ff3b30';
    case 'error': return '#ff9500';
    default: return '#888';
  }
};

export const FileSearchProgressV2: React.FC<FileSearchProgressProps> = ({
  onGrantPermission,
  onDenyPermission,
  onCancel,
  onSelectFile
}) => {
  const { settings } = useSettings();
  const [orchestratorState, setOrchestratorState] = useState<OrchestratorState | null>(null);
  const [autoGranted, setAutoGranted] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  
  // Subscribe to orchestrator state
  useEffect(() => {
    const handleStateUpdate = (event: CustomEvent<OrchestratorState>) => {
      setOrchestratorState(event.detail);
    };

    window.addEventListener('file-search-update', handleStateUpdate as EventListener);
    
    return () => {
      window.removeEventListener('file-search-update', handleStateUpdate as EventListener);
    };
  }, []);

  const operation = orchestratorState?.currentOperation;
  
  if (!operation) return null;
  
  const currentStep = operation.steps[operation.currentStepIndex];
  const isRequestingPermission = currentStep?.status === 'requesting_permission';
  const isResultsReady = operation.status === 'results_ready';
  const isComplete = operation.status === 'completed' || operation.status === 'not_found';
  const isDark = settings.darkMode;

  // ⚡ AUTO-GRANT: DEV ONLY
  useEffect(() => {
    if (isRequestingPermission && currentStep && !autoGranted) {
      setAutoGranted(true);
      
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.warn('[UI] ⚠️ DEV MODE: Auto-granting permission (BYPASSING REAL TCC!)');
        console.warn('[UI] 📋 Production requires real macOS permission dialog');
        
        const timer = setTimeout(() => {
          console.log('[UI] ⚡ AUTO-GRANTING permission for:', currentStep.location);
          onGrantPermission(operation.id);
        }, 800);
        
        return () => clearTimeout(timer);
      } else {
        console.log('[UI] 🔒 PRODUCTION MODE: Waiting for real TCC grant...');
        console.log('[UI] 📋 User must click "Allow" in macOS system dialog');
        // NO auto-grant in production
      }
    }
    
    // Reset auto-grant flag when moving to new step
    if (!isRequestingPermission) {
      setAutoGranted(false);
    }
  }, [isRequestingPermission, currentStep?.location, operation.id, onGrantPermission]);

  // Handle file selection
  const handleSelectFile = (file: SearchResult, index: number) => {
    setSelectedFileIndex(index);
    console.log('[UI] 📂 User selected:', file.name, '(index:', index + ')');
    onSelectFile(operation.id, file.path);
  };

  return (
    <Window
      id="file-search-progress-v2"
      appName="File Search V2"
      title={`Searching for "${operation.filename}"`}
      icon="/icons/search.png"
      initialX={100}
      initialY={100}
      initialWidth={700}
      initialHeight={600}
      isMinimized={false}
      zIndex={100}
      onClose={() => {
        console.log('[UI] 🚫 User closed window - cancelling operation');
        onCancel(operation.id);
      }}
      onMinimize={() => {
        console.log('[UI] 📉 Window minimized');
      }}
      onFocus={() => {}}
      desktopRef={{ current: null }}
      themeColor="#0b79ff"
    >
      <div style={{
        padding: 24,
        color: isDark ? '#ffffff' : '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", Monaco, Menlo, monospace',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
              color: isDark ? '#ffffff' : '#000000',
              letterSpacing: 0.5
            }}>
              🔍 Searching: <span style={{ color: '#0b79ff' }}>{operation.filename}</span>
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? '#aaa' : '#666',
              fontFamily: 'monospace'
            }}>
              Status: {operation.status.toUpperCase()} • Queue: {orchestratorState.queue.length} • v{orchestratorState.version.split('-')[0]}
            </div>
          </div>
          
          {/* Cancel button */}
          {!isComplete && (
            <button
              onClick={() => onCancel(operation.id)}
              style={{
                padding: '8px 16px',
                background: '#ff3b30',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              Cancel
            </button>
          )}
        </div>
        
        {/* Search Steps Progress */}
        <div style={{
          flex: isResultsReady ? '0 0 auto' : 1,
          overflowY: 'auto',
          marginBottom: 16
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
            color: isDark ? '#ccc' : '#666',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Search Progress
          </div>
          
          {operation.steps.map((step, index) => {
            const isCurrentStep = index === operation.currentStepIndex;
            const isPast = index < operation.currentStepIndex;
            
            return (
              <div key={step.id} style={{
                padding: '14px 16px',
                marginBottom: 8,
                borderRadius: 8,
                background: isDark 
                  ? (isCurrentStep ? 'rgba(11,121,255,0.2)' : 'rgba(255,255,255,0.05)')
                  : (isCurrentStep ? 'rgba(11,121,255,0.12)' : 'rgba(0,0,0,0.03)'),
                border: `2px solid ${isCurrentStep ? '#0b79ff' : (isPast ? '#34c759' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'))}`,
                opacity: step.status === 'pending' ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6
                }}>
                  <span style={{ fontSize: 22 }}>{getStatusIcon(step.status)}</span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: getStatusColor(step.status, isDark),
                    flex: 1
                  }}>
                    {step.location}
                  </span>
                  {isCurrentStep && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '3px 8px',
                      background: '#0b79ff',
                      color: 'white',
                      borderRadius: 4
                    }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: isDark ? '#aaa' : '#666',
                  whiteSpace: 'pre-wrap'
                }}>
                  {step.humanLog}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Results List (when results are ready) */}
        {isResultsReady && operation.allResults && operation.allResults.length > 0 && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: 16
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 12,
              color: isDark ? '#ccc' : '#666',
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              📊 Found {operation.allResults.length} result(s) - Select one to move to Smarty Finder
            </div>
            
            {operation.allResults.slice(0, 10).map((file, index) => (
              <div
                key={file.path}
                onClick={() => handleSelectFile(file, index)}
                style={{
                  padding: '12px 14px',
                  marginBottom: 6,
                  borderRadius: 8,
                  background: selectedFileIndex === index
                    ? 'rgba(11,121,255,0.2)'
                    : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                  border: `2px solid ${selectedFileIndex === index ? '#0b79ff' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flex: 1
                  }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: isDark ? '#fff' : '#000',
                        marginBottom: 2
                      }}>
                        {file.name}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: isDark ? '#aaa' : '#666',
                        fontWeight: 500
                      }}>
                        {file.description} • Score: {file.score}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    style={{
                      padding: '6px 12px',
                      background: '#34c759',
                      color: 'white',
                      border: 'none',
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Move to Smarty
                  </button>
                </div>
                
                <div style={{
                  fontSize: 10,
                  color: isDark ? '#888' : '#999',
                  marginTop: 4,
                  fontFamily: 'monospace'
                }}>
                  {file.path}
                </div>
              </div>
            ))}
            
            {operation.allResults.length > 10 && (
              <div style={{
                fontSize: 12,
                color: isDark ? '#888' : '#999',
                textAlign: 'center',
                padding: '10px'
              }}>
                + {operation.allResults.length - 10} more results...
              </div>
            )}
          </div>
        )}
        
        {/* Permission Request UI */}
        {isRequestingPermission && currentStep && (
          <div style={{
            padding: 16,
            borderRadius: 10,
            background: 'rgba(255,204,0,0.1)',
            border: '2px solid #ffcc00',
            marginBottom: 16
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              color: isDark ? '#fff' : '#000'
            }}>
              🔐 Permission Required
            </div>
            <div style={{
              fontSize: 12,
              color: isDark ? '#aaa' : '#666',
              marginBottom: 12
            }}>
              Need permission to search {currentStep.location}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => onGrantPermission(operation.id)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#34c759',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Grant Permission
              </button>
              <button
                onClick={() => onDenyPermission(operation.id)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: isDark ? '#333' : '#f5f5f5',
                  color: isDark ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Skip
              </button>
            </div>
          </div>
        )}
        
        {/* Completion Message */}
        {isComplete && (
          <div style={{
            padding: 16,
            borderRadius: 10,
            background: operation.status === 'completed' ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
            border: `2px solid ${operation.status === 'completed' ? '#34c759' : '#ff3b30'}`
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: operation.status === 'completed' ? '#34c759' : '#ff3b30'
            }}>
              {operation.status === 'completed' ? '✅ Search Complete!' : '❌ File Not Found'}
            </div>
            <div style={{
              fontSize: 12,
              color: isDark ? '#aaa' : '#666',
              marginTop: 6
            }}>
              {currentStep?.humanLog}
            </div>
          </div>
        )}
        
        {/* Version Stamp */}
        <div style={{
          marginTop: 16,
          padding: '8px 12px',
          borderRadius: 6,
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          fontSize: 10,
          color: isDark ? '#888' : '#999',
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          Build: {orchestratorState.version}
        </div>
      </div>
    </Window>
  );
};

export default FileSearchProgressV2;
