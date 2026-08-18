import React, { useEffect, useState, useCallback, useMemo } from 'react';
import useCapabilityManager from '@/hooks/useCapabilityManager';
import { Window } from '@/components/Dekstop/window';
import { toast } from 'sonner';

// Theme-aware styles that work in both dark and light modes
const getStyles = (isDark: boolean) => ({
  content: {
    padding: 24
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

// Button style helpers with proper dark/light mode contrast
const getButtonStyle = (variant: 'primary' | 'secondary' | 'danger' | 'debug', isDark: boolean): React.CSSProperties => {
  const base: React.CSSProperties = {
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none'
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
        background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
        color: isDark ? '#fff' : '#111',
        border: isDark ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(0,0,0,0.12)'
      };
    case 'danger':
      return {
        ...base,
        background: isDark ? 'rgba(255,59,48,0.25)' : 'rgba(255,59,48,0.12)',
        color: '#ff3b30',
        border: isDark ? '1px solid rgba(255,59,48,0.4)' : '1px solid rgba(255,59,48,0.25)'
      };
    case 'debug':
      return {
        ...base,
        background: isDark ? 'rgba(255,204,0,0.15)' : '#ffcc00',
        color: isDark ? '#ffcc00' : '#333',
        border: isDark ? '1px solid rgba(255,204,0,0.3)' : '1px solid rgba(255,204,0,0.4)'
      };
  }
};

const PermissionPrompt: React.FC = () => {
  const { pending, grant, deny, operations } = useCapabilityManager(500);
  const isDark = useThemeDetection();
  const styles = useMemo(() => getStyles(isDark), [isDark]);

  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  
  const [alwaysAllowInDev, setAlwaysAllowInDev] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem('smarty.capability.devBypass.v1') === 'true';
      }
    } catch (e) {}
    return false;
  });

  // Monitor capability requests
  useEffect(() => {
    if (pending && pending.length > 0) {
      setCurrent(pending[0]);
      setVisible(true);
    } else {
      setVisible(false);
      setCurrent(null);
    }
  }, [pending]);

  const onAllowOnce = useCallback(() => {
    if (!current) return;
    
    // Request ephemeral (Allow Once) grant server-side
    fetch('/api/capability/grant', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ capability: current.capability, persistent: false }) 
    })
      .then(res => res.json())
      .then(body => {
        if (body?.token) {
          (window as any).__smarty_ephemeral_tokens = (window as any).__smarty_ephemeral_tokens || {};
          (window as any).__smarty_ephemeral_tokens[current.capability] = body.token;
        }
      })
      .catch(() => {});
    
    grant(current.capability, false);
    toast.success(`✓ Allowed ${current.capability} once`);
  }, [current, grant]);

  const onAllow = useCallback(() => {
    if (!current) return;
    
    // Persistent grant
    fetch('/api/capability/grant', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ capability: current.capability, persistent: true }) 
    }).catch(() => {});
    
    grant(current.capability, true);
    toast.success(`✓ Allowed ${current.capability}`);
  }, [current, grant]);

  const onDeny = useCallback(() => {
    if (!current) return;
    
    fetch('/api/capability/revoke', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ capability: current.capability }) 
    }).catch(() => {});
    
    deny(current.capability);
    toast.error(`✗ Denied ${current.capability}`);
  }, [current, deny]);

  const onOpenClaw = useCallback(() => {
    if (!current) return;
    
    try {
      window.dispatchEvent(new CustomEvent('capability:userOPENCLAW', { 
        detail: { 
          capability: current.capability, 
          ops: operations
            .filter((op: any) => (op.requiredCapabilities || []).includes(current.capability))
            .map((o: any) => o.id) 
        } 
      }));
      toast('🔍 Opening Finder — select the file manually');
    } catch (e) {
      console.warn('userOPENCLAW event dispatch failed', e);
    }
  }, [current, operations]);

  const onGrantDebug = useCallback(() => {
    if (!current) return;
    grant(current.capability, true);
    toast.success('✓ Granted for debug');
  }, [current, grant]);

  const toggleAlwaysAllow = useCallback(() => {
    const next = !alwaysAllowInDev;
    setAlwaysAllowInDev(next);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('smarty.capability.devBypass.v1', next ? 'true' : 'false');
      }
    } catch (e) {}
    toast(next ? '⚙️ Dev-bypass enabled' : '⚙️ Dev-bypass disabled');
  }, [alwaysAllowInDev]);

  // Operations requiring this capability
  const chainOps = operations.filter((op: any) => 
    (op.requiredCapabilities || []).includes(current?.capability)
  );

  // Early return AFTER all hooks (per React rules)
  if (!visible || !current) return null;

  // Extract capability info for human-readable display
  const capName = current.capability.split('.').pop() || current.capability;
  const capScope = current.capability.split('.')[0] || 'system';

  return (
    <Window
      id={`permission-${current.capability}`}
      title={`Permission Request — ${capName}`}
      icon="/icons/lock.png"
      appName="PermissionPrompt"
      initialX={Math.max(80, (window.innerWidth / 2) - 280)}
      initialY={Math.max(80, (window.innerHeight / 2) - 200)}
      initialWidth={560}
      initialHeight={380}
      isMinimized={false}
      zIndex={2147483665}
      onClose={() => {
        if (pending && pending.length > 0) {
          toast.error('Resolve pending permissions before closing');
        }
      }}
      onMinimize={() => toast('Permission prompt cannot be minimized')}
      onFocus={() => {}}
      desktopRef={{ current: document.getElementById('desktop-root') } as any}
      themeColor="220, 14, 91"
    >
      <div style={styles.content}>
        {/* Header with icon */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          marginBottom: 16 
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: isDark ? 'rgba(11,121,255,0.2)' : 'rgba(11,121,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            🔐
          </div>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: 17, 
              fontWeight: 600,
              color: isDark ? '#fff' : '#111'
            }}>
              Smarty needs permission
            </h3>
            <div style={{ 
              fontSize: 12, 
              color: isDark ? '#888' : '#666',
              marginTop: 2
            }}>
              {capScope.charAt(0).toUpperCase() + capScope.slice(1)} access required
            </div>
          </div>
        </div>

        {/* Capability name */}
        <div style={{
          padding: 12,
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderRadius: 8,
          marginBottom: 16,
          borderLeft: `3px solid ${isDark ? '#0b79ff' : '#007aff'}`
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 500,
            color: isDark ? '#fff' : '#111'
          }}>
            {current.capability}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: isDark ? '#aaa' : '#666',
            marginTop: 4
          }}>
            Allow Smarty to use {capName} on your Mac
          </div>
        </div>

        {/* Related operations */}
        {chainOps && chainOps.length > 0 && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
            borderRadius: 8,
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'
          }}>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 600,
              color: isDark ? '#aaa' : '#555',
              marginBottom: 8
            }}>
              Required for:
            </div>
            <ul style={{ 
              margin: 0, 
              padding: '0 0 0 20',
              color: isDark ? '#ccc' : '#333'
            }}>
              {chainOps.slice(0, 3).map((op: any) => (
                <li key={op.id} style={{ 
                  fontSize: 13, 
                  marginBottom: 4,
                  color: isDark ? '#ccc' : '#333'
                }}>
                  {op.intent || 'automation'} • {op.sequence?.length || 0} steps
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Permission buttons */}
        <div style={styles.buttons}>
          <button 
            onClick={onOpenClaw} 
            style={getButtonStyle('secondary', isDark)}
          >
            🔍 OpenClaw
          </button>
          <button 
            onClick={onAllowOnce} 
            style={getButtonStyle('secondary', isDark)}
          >
            Allow Once
          </button>
          <button 
            onClick={onAllow} 
            style={getButtonStyle('primary', isDark)}
          >
            Allow
          </button>
          <button 
            onClick={onDeny} 
            style={getButtonStyle('danger', isDark)}
          >
            Deny
          </button>
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={onGrantDebug} 
              style={getButtonStyle('debug', isDark)}
            >
              Debug
            </button>
          )}
        </div>

        {/* Dev bypass toggle */}
        <div style={{ 
          marginTop: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8 
        }}>
          <input 
            id="dev-bypass" 
            type="checkbox" 
            checked={alwaysAllowInDev} 
            onChange={toggleAlwaysAllow}
            style={{ cursor: 'pointer' }}
          />
          <label 
            htmlFor="dev-bypass" 
            style={{ 
              fontSize: 12, 
              color: isDark ? '#888' : '#666',
              cursor: 'pointer'
            }}
          >
            Auto-grant in dev mode
          </label>
        </div>
      </div>
    </Window>
  );
};

export default PermissionPrompt;
