import React, { useEffect, useState, useCallback, useMemo } from 'react';
import useCapabilityManager from '@/hooks/useCapabilityManager';
import { Window } from '@/components/Dekstop/window';
import { toast } from 'sonner';
import { fileSearchOrchestrator, FileSearchOperation } from '@/lib/fileSearchOrchestrator';

// Theme-aware styles that work in both dark and light modes
const getStyles = (isDark: boolean) => ({
  backdrop: {
    position: 'fixed' as const,
    left: 0,
    top: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 2147483660,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.18)',
    WebkitBackdropFilter: 'blur(6px)'
  },
  window: {
    width: 560,
    maxWidth: '90vw',
    borderRadius: 12,
    overflow: 'hidden',
    background: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
    boxShadow: '0 40px 120px rgba(0,0,0,0.45)',
    color: isDark ? '#fff' : '#111',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
    backdropFilter: 'blur(12px)'
  },
  titlebar: {
    height: 36,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    WebkitAppRegion: 'drag' as any,
    background: isDark 
      ? 'linear-gradient(180deg, rgba(50,50,50,0.8), rgba(40,40,40,0.6))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.45))'
  },
  traffic: {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  trafficDot: (color: string) => ({
    width: 12,
    height: 12,
    borderRadius: 12,
    background: color,
    display: 'inline-block'
  }),
  content: {
    padding: 24
  },
  titleText: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 13,
    color: isDark ? '#ddd' : '#222',
    fontWeight: 600
  },
  stepContainer: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
    color: isDark ? '#fff' : '#111'
  },
  stepLog: {
    fontSize: 12,
    color: isDark ? '#aaa' : '#666'
  },
  humanLog: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 1.6,
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderLeft: `4px solid ${isDark ? '#0a84ff' : '#007aff'}`
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap' as const
  }
});

// Detect if we're in dark mode
const useThemeDetection = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const hasDarkBg = document.body?.style?.background?.includes('rgb(1') || 
                        document.body?.style?.background?.includes('#1');
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

// Button style helpers
const getButtonStyle = (variant: 'primary' | 'secondary' | 'danger' | 'debug', isDark: boolean) => {
  const base = {
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: 'none'
  };

  switch (variant) {
    case 'primary':
      return {
        ...base,
        background: '#0b79ff',
        color: '#fff'
      };
    case 'secondary':
      return {
        ...base,
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        color: isDark ? '#fff' : '#111',
        border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)'
      };
    case 'danger':
      return {
        ...base,
        background: isDark ? 'rgba(255,59,48,0.2)' : 'rgba(255,59,48,0.1)',
        color: '#ff3b30',
        border: isDark ? '1px solid rgba(255,59,48,0.3)' : '1px solid rgba(255,59,48,0.2)'
      };
    case 'debug':
      return {
        ...base,
        background: isDark ? 'rgba(255,204,0,0.1)' : '#ffcc00',
        color: isDark ? '#ffcc00' : '#333',
        border: isDark ? '1px solid rgba(255,204,0,0.2)' : '1px solid rgba(255,204,0,0.3)'
      };
  }
};

const PermissionPrompt: React.FC = () => {
  const { pending, grant, deny, operations } = useCapabilityManager(500);
  const isDark = useThemeDetection();
  const styles = useMemo(() => getStyles(isDark), [isDark]);

  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  
  // File search state
  const [fileSearchOp, setFileSearchOp] = useState<FileSearchOperation | null>(null);
  const [searchLogs, setSearchLogs] = useState<string[]>([]);
  
  const [alwaysAllowInDev, setAlwaysAllowInDev] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem('smarty.capability.devBypass.v1') === 'true';
      }
    } catch (e) {}
    return false;
  });

  // Subscribe to file search orchestrator
  useEffect(() => {
    const unsubscribe = fileSearchOrchestrator.subscribe((state) => {
      setFileSearchOp(state.currentOperation);
      
      if (state.currentOperation) {
        const logs = state.currentOperation.steps
          .slice(0, state.currentOperation.currentStepIndex + 1)
          .map(step => step.humanLog);
        setSearchLogs(logs);
      }
    });

    return unsubscribe;
  }, []);

  // Monitor capability requests
  useEffect(() => {
    if (pending && pending.length > 0) {
      setCurrent(pending[0]);
      setVisible(true);
    } else if (!fileSearchOp) {
      setVisible(false);
      setCurrent(null);
    }
  }, [pending, fileSearchOp]);

  const onAllowOnce = useCallback(() => {
    if (!current) return;
    
    // Request ephemeral (Allow Once) grant server-side, then update local state and store token
    (async () => {
      try {
        const res = await fetch('/api/capability/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capability: current.capability, persistent: false }) });
        const body = await res.json().catch(() => ({}));
        if (body && body.token) {
          try {
            (window as any).__smarty_ephemeral_tokens = (window as any).__smarty_ephemeral_tokens || {};
            (window as any).__smarty_ephemeral_tokens[current.capability] = body.token;
          } catch (e) {}
        }
      } catch (e) {}
    })();
    
    grant(current.capability, false);
    
    // If file search is active, grant permission for next step
    if (fileSearchOp) {
      fileSearchOrchestrator.grantPermission(fileSearchOp.id);
    }
    
    toast.success(`Allowed ${current.capability} once`);
  }, [current, grant, fileSearchOp]);

  const onAllow = useCallback(() => {
    if (!current) return;
    
    // Persistent grant: inform server and update local state
    fetch('/api/capability/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capability: current.capability, persistent: true }) }).catch(() => {});
    
    grant(current.capability, true);
    
    // If file search is active, grant permission for next step
    if (fileSearchOp) {
      fileSearchOrchestrator.grantPermission(fileSearchOp.id);
    }
    
    toast.success(`Allowed ${current.capability}`);
  }, [current, grant, fileSearchOp]);

  const onDeny = useCallback(() => {
    if (!current) return;
    
    // Inform server (best-effort) and update local state
    fetch('/api/capability/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capability: current.capability }) }).catch(() => {});
    
    deny(current.capability);
    
    // If file search is active, deny and move to next location
    if (fileSearchOp) {
      fileSearchOrchestrator.denyPermission(fileSearchOp.id);
      toast.error(`Skipping ${fileSearchOp.steps[fileSearchOp.currentStepIndex]?.location}...`);
    } else {
      toast.error(`Denied ${current.capability}`);
    }
  }, [current, deny, fileSearchOp]);

  const onOpenClaw = () => {
    // Emit an event for native provider to open Finder / request OS-level assistance
    try {
      window.dispatchEvent(new CustomEvent('capability:userOPENCLAW', { detail: { capability: current.capability, ops: operations.filter((op: any) => (op.requiredCapabilities || []).includes(current.capability)).map((o: any) => o.id) } }));
      toast('Opening Finder — please locate the file and complete the operation');
    } catch (e) {
      console.warn('userOPENCLAW event dispatch failed', e);
    }
  };

  const onGrantDebug = () => {
    // Developer helper to quickly grant during testing
    grant(current.capability, true);
    toast.success('Granted for debug');
  };

  const toggleAlwaysAllow = () => {
    const next = !alwaysAllowInDev;
    setAlwaysAllowInDev(next);
    try {
      const cm = require('@/lib/capabilityManager').capabilityManager;
      if ((cm as any).setDevBypass) (cm as any).setDevBypass(next);
    } catch (e) {
      console.warn('setDevBypass not available', e);
    }
    toast(next ? 'Dev-bypass enabled: permissions will be auto-granted' : 'Dev-bypass disabled');
  };

  // Chain ithis capability
  const chainOps = operations.filter((op: any) => (op.requiredCapabilities || []).includes(current?.capability));

  // Early return AFTER all hooks
  if (!visible || !current) return null;

  return (
    <Window
      id={`permission-${current.capability}`}
      title={`Permission — ${current.capability}`}
      icon="/icons/lock.png"
      appName="PermissionPrompt"
      initialX={Math.max(80, (window.innerWidth / 2) - 260)}
      initialY={Math.max(80, (window.innerHeight / 2) - 160)}
      initialWidth={520}
      initialHeight={260}
      isMinimized={false}
      zIndex={2147483665}
      onClose={(id) => {
        // Prevent closing while pending
        if (pending && pending.length > 0) {
          toast.error('Resolve pending permissions before closing');
          return;
        }
      }}
      onMinimize={() => { toast('Permission prompt cannot be minimized while pending'); }}
      onFocus={() => {}}
      desktopRef={{ current: document.getElementById('desktop-root') } as any}
      themeColor="220, 14, 91"
    >
      <div style={styles.content as React.CSSProperties}>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>{`Allow \"Smarty\" to use ${current.capability}?`}</h3>
        <p style={{ marginTop: 6, marginBottom: 10, color: '#333' }}>Allowing this will let the assistant complete the requested action on your Mac. Use "OpenClaw" to open Finder and select files manually.</p>

        {chainOps && chainOps.length > 0 && (
          <div style={{ marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.6)', borderRadius: 8, border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, color: '#444', fontWeight: 600 }}>This permission is required for:</div>
            <ul style={{ marginTop: 8, paddingLeft: 18, color: '#444' }}>
              {chainOps.map((op: any) => (
                <li key={op.id} style={{ fontSize: 13 }}>{op.intent || 'automation'} • {op.sequence?.length || 0} steps</li>
              ))}
            </ul>
          </div>
        )}

        <div style={styles.buttons as React.CSSProperties}>
          <button onClick={onOpenClaw} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>OpenClaw (Finder)</button>
          <button onClick={onAllowOnce} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>Allow Once</button>
          <button onClick={onAllow} style={{ padding: '8px 12px', borderRadius: 8, background: '#0b79ff', color: '#fff', border: 'none' }}>Allow</button>
          <button onClick={onDeny} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>Deny</button>
          <button onClick={onGrantDebug} style={{ padding: '8px 12px', borderRadius: 8, background: '#eee', border: '1px solid rgba(0,0,0,0.06)' }}>Grant (debug)</button>
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input id="dev-bypass" type="checkbox" checked={alwaysAllowInDev} onChange={toggleAlwaysAllow} />
          <label htmlFor="dev-bypass" style={{ fontSize: 12, color: '#444' }}>Always allow in dev (auto-grant)</label>
        </div>
      </div>
    </Window>
  );
};

export default PermissionPrompt;
