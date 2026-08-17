import React, { useEffect } from 'react';
import useCapabilityManager from '@/hooks/useCapabilityManager';
import { Window } from '@/components/Dekstop/window';
import { toast } from 'sonner';

// macOS-style permission window styled to look like a native dialog
const styles = {
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
    background: 'rgba(0,0,0,0.18)',
    WebkitBackdropFilter: 'blur(6px)'
  },
  window: {
    width: 520,
    borderRadius: 12,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.85)',
    boxShadow: '0 40px 120px rgba(0,0,0,0.45)',
    color: '#111',
    border: '1px solid rgba(0,0,0,0.08)',
    backdropFilter: 'blur(8px)'
  },
  titlebar: {
    height: 36,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    WebkitAppRegion: 'drag' as any,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.45))'
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
    padding: 20
  },
  titleText: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 13,
    color: '#222',
    fontWeight: 600
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12
  }
}

const PermissionPrompt: React.FC = () => {
  const { pending, grant, deny, operations } = useCapabilityManager(500);

  const [visible, setVisible] = React.useState(false);
  const [current, setCurrent] = React.useState<any | null>(null);

  useEffect(() => {
    if (pending && pending.length > 0) {
      setCurrent(pending[0]);
      setVisible(true);
    } else {
      setVisible(false);
      setCurrent(null);
    }
  }, [pending]);

  if (!visible || !current) return null;

  const onAllowOnce = () => {
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
    toast.success(`Allowed ${current.capability} once`);
  };
  const onAllow = () => {
    // Persistent grant: inform server and update local state
    fetch('/api/capability/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capability: current.capability, persistent: true }) }).catch(() => {});
    grant(current.capability, true);
    toast.success(`Allowed ${current.capability}`);
  };
  const onDeny = () => {
    // Inform server (best-effort) and update local state
    fetch('/api/capability/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capability: current.capability }) }).catch(() => {});
    deny(current.capability);
    toast.error(`Denied ${current.capability}`);
  };

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

  const [alwaysAllowInDev, setAlwaysAllowInDev] = React.useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem('smarty.capability.devBypass.v1') === 'true';
      }
    } catch (e) {}
    return false;
  });

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

  // Chain info: show ops that require this capability
  const chainOps = operations.filter((op: any) => (op.requiredCapabilities || []).includes(current.capability));

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
