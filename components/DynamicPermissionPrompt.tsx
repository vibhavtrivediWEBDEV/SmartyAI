import React, { useEffect, useState, useCallback, useMemo } from 'react';
import capabilityQueue, { PermissionRequest, PermissionDecision } from '@/lib/capabilityQueue';
import { Window } from '@/components/Dekstop/window';

/**
 * Enhanced Permission Prompt with Dynamic Capability Queue Integration
 * 
 * Features:
 * - Receives permission requests dynamically
 * - Displays resource-specific prompts (Documents, Desktop, Downloads)
 * - Supports allow-once, allow-always, deny
 * - Works in dark and light modes
 * - Shows operation context and progress
 */

const getThemeStyles = (isDark: boolean) => ({
  container: {
    padding: '24px',
    maxWidth: '480px',
    minWidth: '400px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  icon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: isDark ? 'rgba(11, 121, 255, 0.15)' : 'rgba(11, 121, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: isDark ? '#fff' : '#111',
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '13px',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'
  },
  content: {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px'
  },
  message: {
    fontSize: '15px',
    lineHeight: 1.5,
    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
    marginBottom: '12px'
  },
  operationContext: {
    fontSize: '12px',
    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
    paddingTop: '12px',
    marginTop: '12px'
  },
  buttons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    flexDirection: 'row-reverse' as const
  },
  button: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: 'none',
    outline: 'none'
  },
  primaryBtn: {
    background: '#0b79ff',
    color: '#fff'
  },
  secondaryBtn: {
    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    color: isDark ? '#fff' : '#111',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`
  },
  dangerBtn: {
    background: isDark ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.08)',
    color: '#ff3b30',
    border: `1px solid ${isDark ? 'rgba(255,59,48,0.3)' : 'rgba(255,59,48,0.15)'}`
  },
  progress: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'
  },
  progressItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }
});

const useThemeDetection = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const hasDarkBg = bodyBg.includes('rgb(1') || bodyBg.includes('rgb(0');
      setIsDark(prefersDark || hasDarkClass || hasDarkBg);
    };

    checkDark();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDark);
    
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      mediaQuery.removeEventListener('change', checkDark);
      observer.disconnect();
    };
  }, []);

  return isDark;
};

const DynamicPermissionPrompt: React.FC = () => {
  const isDark = useThemeDetection();
  const styles = useMemo(() => getThemeStyles(isDark), [isDark]);
  
  const [visible, setVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<PermissionRequest | null>(null);
  const [operationProgress, setOperationProgress] = useState<string[]>([]);

  // Subscribe to capability queue events
  useEffect(() => {
    const unsubscribe = capabilityQueue.subscribe((type, data) => {
      console.log('[PermissionPrompt] Event:', type, data);
      
      if (type === 'permission:requested') {
        setCurrentRequest(data);
        setVisible(true);
      } else if (type === 'permission:granted') {
        setVisible(false);
        // Track progress
        setOperationProgress(prev => [...prev, `✅ ${data.request.capability.resource}`]);
      } else if (type === 'permission:denied') {
        setVisible(false);
        setOperationProgress(prev => [...prev, `❌ ${data.request.capability.resource}`]);
      }
    });

    // Also poll for pending requests (fallback)
    const interval = setInterval(() => {
      const pending = capabilityQueue.getPendingRequests();
      if (pending.length > 0 && !currentRequest) {
        setCurrentRequest(pending[0]);
        setVisible(true);
      }
    }, 500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentRequest]);

  const handleDecision = useCallback((decision: PermissionDecision) => {
    if (!currentRequest) return;
    
    console.log('[PermissionPrompt] User decision:', decision, currentRequest.requestId);
    
    capabilityQueue.resolvePermission(currentRequest.requestId, decision);
    
    if (decision === 'deny') {
      setVisible(false);
    }
  }, [currentRequest]);

  // Build human-readable message
  const getMessage = (): string => {
    if (!currentRequest) return '';
    
    const { capability, action } = currentRequest;
    const resource = capability.resource;
    
    // Dynamic message based on capability and resource
    if (capability.capability === 'filesystem.read' || capability.capability === 'filesystem.search') {
      if (action.includes('search')) {
        const operation = capabilityQueue.getOperation(currentRequest.operationId);
        const searchTerm = operation?.parameters?.filename || 'file';
        return `SmartyAI wants to search your ${resource} for "${searchTerm}".`;
      }
      return `SmartyAI wants to access files in your ${resource}.`;
    }
    
    return `SmartyAI wants to use ${capability.capability} on ${resource}.`;
  };

  const getButtonLabel = (decision: PermissionDecision): string => {
    switch (decision) {
      case 'allow-once': return 'Allow Once';
      case 'allow-always': return 'Always Allow';
      case 'deny': return 'Deny & Skip';
    }
  };

  if (!visible || !currentRequest) {
    return null;
  }

  return (
    <Window
      title="Permission Required"
      initialSize={{ width: 480, height: 320 }}
      windowId="permission-prompt"
    >
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.icon}>🔐</div>
          <div>
            <div style={styles.title}>Permission Required</div>
            <div style={styles.subtitle}>{currentRequest.capability.resource}</div>
          </div>
        </div>

        {/* Progress (if any) */}
        {operationProgress.length > 0 && (
          <div style={styles.progress}>
            {operationProgress.map((step, i) => (
              <div key={i} style={styles.progressItem}>{step}</div>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={styles.content}>
          <div style={styles.message}>{getMessage()}</div>
          
          <div style={styles.operationContext}>
            <div><strong>Request ID:</strong> {currentRequest.requestId}</div>
            <div><strong>Operation ID:</strong> {currentRequest.operationId}</div>
            <div><strong>Capability:</strong> {currentRequest.capability.capability}</div>
            <div><strong>Resource:</strong> {currentRequest.capability.resource}</div>
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttons}>
          {currentRequest.allowedDecisions.includes('allow-once') && (
            <button
              style={{ ...styles.button, ...styles.primaryBtn }}
              onClick={() => handleDecision('allow-once')}
            >
              {getButtonLabel('allow-once')}
            </button>
          )}
          
          {currentRequest.allowedDecisions.includes('allow-always') && (
            <button
              style={{ ...styles.button, ...styles.secondaryBtn }}
              onClick={() => handleDecision('allow-always')}
            >
              {getButtonLabel('allow-always')}
            </button>
          )}
          
          {currentRequest.allowedDecisions.includes('deny') && (
            <button
              style={{ ...styles.button, ...styles.dangerBtn }}
              onClick={() => handleDecision('deny')}
            >
              {getButtonLabel('deny')}
            </button>
          )}
        </div>
      </div>
    </Window>
  );
};

export default DynamicPermissionPrompt;
