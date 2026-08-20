/**
 * FileSearchProgress - OpenClaw-style file search UI
 * 
 * Shows:
 * - Queue of pending search locations
 * - Current permission request
 * - Search progress with human-readable logs
 * - Uses global theme from settings
 */

import React, { useEffect, useState } from 'react';
import { Window } from '@/components/Dekstop/window';
import { useSettings } from '@/app/context/settingContext';
import FolderTreeVisualizer from './FolderTreeVisualizer';

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
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'not_found';
  foundFile?: SearchResult;
}

interface FileSearchProgressProps {
  operation: FileSearchOperation | null;
  onGrantPermission: (operationId: string) => void;
  onDenyPermission: (operationId: string) => void;
  onCancel: (operationId: string) => void;
  onOpenInFinder?: (operationId: string, filePath: string) => void;
  onSelectFile?: (operationId: string, filePath: string) => void;
}

// Apple-style design tokens
const tokens = (isDark: boolean) => ({
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
  mono: '"SF Mono", Menlo, monospace',
  bg: isDark ? '#1e1e1e' : '#ffffff',
  text: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.9)',
  textSecondary: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
  textTertiary: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
  divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
  surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
  surfaceRaised: isDark ? 'rgba(255,255,255,0.06)' : '#f7f7f8',
  accent: isDark ? '#0A84FF' : '#007AFF',
  accentSoft: isDark ? 'rgba(10,132,255,0.14)' : 'rgba(0,122,255,0.08)',
  success: isDark ? '#30D158' : '#34C759',
  successSoft: isDark ? 'rgba(48,209,88,0.12)' : 'rgba(52,199,89,0.08)',
  warning: isDark ? '#FFD60A' : '#FF9500',
  danger: isDark ? '#FF453A' : '#FF3B30',
});

// Status → dot color + label
const getStatusMeta = (status: SearchStep['status'], t: ReturnType<typeof tokens>) => {
  switch (status) {
    case 'pending': return { color: t.textTertiary, label: 'Pending' };
    case 'requesting_permission': return { color: t.warning, label: 'Needs Permission' };
    case 'searching': return { color: t.accent, label: 'Searching' };
    case 'found': return { color: t.success, label: 'Found' };
    case 'not_found': return { color: t.textTertiary, label: 'No Match' };
    case 'denied': return { color: t.danger, label: 'Denied' };
    case 'error': return { color: t.danger, label: 'Error' };
    default: return { color: t.textTertiary, label: status };
  }
};

export const FileSearchProgress: React.FC<FileSearchProgressProps> = ({
  operation,
  onGrantPermission,
  onDenyPermission,
  onCancel,
  onOpenInFinder
}) => {
  const { settings } = useSettings();

  if (!operation) return null;

  const currentStep = operation.steps[operation.currentStepIndex];
  const isRequestingPermission = currentStep?.status === 'requesting_permission' || currentStep?.status === 'waiting_permission';
  const isComplete = operation.status === 'completed' || operation.status === 'not_found';
  const isFound = operation.foundFile !== undefined;
  const isDark = settings.darkMode;
  const t = tokens(isDark);

  React.useEffect(() => {
    if (operation) {
      console.log('[FileSearchProgress] Operation state:', operation.status, currentStep?.location, currentStep?.status);
    }
  }, [operation, currentStep]);

  React.useEffect(() => {
    if (isRequestingPermission && currentStep) {
      console.log('[FileSearchProgress] Waiting for user decision on:', currentStep.location);
    }
  }, [isRequestingPermission, currentStep?.location]);

  const handleOpenInFinder = () => {
    if (operation?.foundFile && onOpenInFinder) {
      onOpenInFinder(operation.id, operation.foundFile.path);
    }
  };

  return (
    <Window
      id="file-search-progress"
      appName="File Search"
      title={`Searching for "${operation.filename}"`}
      icon="/icons/search.png"
      initialX={100}
      initialY={100}
      initialWidth={800}
      initialHeight={600}
      isMinimized={false}
      zIndex={100}
      onClose={() => onCancel(operation.id)}
      onMinimize={() => {}}
      onFocus={() => {}}
      desktopRef={{ current: null }}
      themeColor={t.accent}
    >
      <div style={{
        padding: '20px 22px',
        color: t.text,
        fontFamily: t.font,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: t.bg
      }}>
        {/* Header */}
        <div style={{
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: `1px solid ${t.divider}`
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 4,
            color: t.text,
          }}>
            {operation.filename}
          </div>
          <div style={{
            fontSize: 12,
            color: t.textSecondary,
          }}>
            {operation.status === 'running' ? 'Searching…' : operation.status.replace('_', ' ')}
          </div>
        </div>

        {/* Search Locations */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: 14
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 8,
            color: t.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: 0.4
          }}>
            Locations
          </div>

          {operation.steps.map((step, index) => {
            const isCurrentStep = index === operation.currentStepIndex;
            const meta = getStatusMeta(step.status, t);

            return (
              <div key={step.id} style={{
                padding: '12px 14px',
                marginBottom: 6,
                borderRadius: 10,
                background: isCurrentStep ? t.surfaceRaised : 'transparent',
                border: `1px solid ${isCurrentStep ? t.divider : 'transparent'}`,
                opacity: step.status === 'pending' ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: meta.color,
                    flexShrink: 0
                  }} />
                  <span style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: t.text,
                    flex: 1,
                  }}>
                    {step.location}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: meta.color,
                    fontWeight: 500
                  }}>
                    {meta.label}
                  </span>
                </div>

                <div style={{
                  fontSize: 12,
                  color: t.textSecondary,
                  marginTop: 6,
                  paddingLeft: 17,
                }}>
                  {step.humanLog || 'Waiting…'}
                </div>

                {step.results && step.results.length > 0 && (
                  <div style={{
                    marginTop: 10,
                    marginLeft: 17,
                    paddingTop: 10,
                    borderTop: `1px solid ${t.divider}`
                  }}>
                    <div style={{
                      fontSize: 11,
                      color: t.textTertiary,
                      marginBottom: 6
                    }}>
                      {step.results.length} result{step.results.length > 1 ? 's' : ''}
                    </div>
                    <FolderTreeVisualizer
                      files={step.results}
                      searchTerm={operation.filename}
                      isDark={isDark}
                    />
                  </div>
                )}

                {step.status === 'found' && (!step.results || step.results.length === 0) && (
                  <div style={{
                    marginTop: 6,
                    paddingLeft: 17,
                    fontSize: 12,
                    color: t.textTertiary,
                  }}>
                    No matching files
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Permission Request */}
        {isRequestingPermission && (
          <div style={{
            padding: 14,
            borderRadius: 10,
            background: t.surfaceRaised,
            border: `1px solid ${t.divider}`,
            marginBottom: 10
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
              color: t.text
            }}>
              Permission Required
            </div>
            <div style={{
              fontSize: 12,
              color: t.textSecondary,
              marginBottom: 12
            }}>
              Allow Smarty to search {currentStep?.location}?
            </div>

            <div style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => onDenyPermission(operation.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: t.textSecondary,
                  border: `1px solid ${t.divider}`,
                }}
              >
                Deny
              </button>

              <button
                onClick={() => onGrantPermission(operation.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: t.accent,
                  color: '#fff',
                  border: 'none',
                }}
              >
                Allow
              </button>
            </div>
          </div>
        )}

        {/* Completion */}
        {isComplete && (
          <div style={{
            marginTop: 10,
            padding: 14,
            borderRadius: 10,
            background: t.surfaceRaised,
            border: `1px solid ${t.divider}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: isFound && operation.foundFile ? 10 : 0
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isFound ? t.success : t.textTertiary
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: t.text,
                }}>
                  {isFound ? 'File Found' : 'Not Found'}
                </div>
                <div style={{
                  fontSize: 12,
                  color: t.textSecondary,
                }}>
                  {isFound
                    ? `In ${operation.steps.find(s => s.status === 'found')?.location}`
                    : 'Checked Desktop, Documents, and Downloads'
                  }
                </div>
              </div>
            </div>

            {isFound && operation.foundFile && (
              <div style={{
                fontSize: 12,
                color: t.textSecondary,
                padding: '10px 12px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderRadius: 8,
              }}>
                <div style={{
                  fontWeight: 500,
                  marginBottom: 4,
                  color: t.text
                }}>
                  {operation.foundFile.name}
                </div>
                <div style={{
                  fontSize: 10.5,
                  fontFamily: t.mono,
                  wordBreak: 'break-all',
                  color: t.textTertiary
                }}>
                  {operation.foundFile.path}
                </div>
                {operation.foundFile.description && (
                  <div style={{
                    fontSize: 11,
                    marginTop: 6,
                    color: t.textSecondary,
                  }}>
                    {operation.foundFile.description}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {isComplete && (
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${t.divider}`
          }}>
            {isFound && operation.foundFile && onOpenInFinder && (
              <button
                onClick={handleOpenInFinder}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  marginBottom: 8,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: t.accent,
                  color: '#fff',
                  border: 'none',
                }}
              >
                Open in Smarty Finder
              </button>
            )}

            <button
              onClick={() => onCancel(operation.id)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                background: 'transparent',
                color: t.textSecondary,
                border: `1px solid ${t.divider}`,
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>

    </Window>
  );
};

export default FileSearchProgress;