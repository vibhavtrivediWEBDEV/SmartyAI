"use client";

import React, { useState } from "react";

interface TccGuidance {
  title: string;
  steps: string[];
  deepLink?: string;
}

interface PermissionPromptProps {
  guidance: TccGuidance;
  onRetry: () => Promise<boolean>;
  onDismiss: () => void;
}

export default function TccGuidancePrompt({ guidance, onRetry, onDismiss }: PermissionPromptProps) {
  const [retrying, setRetrying] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleOpenSettings = () => {
    if (guidance.deepLink) {
      try {
        window.open(guidance.deepLink, "_self");
      } catch (e) {
        // ignore
      }
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const handleStartHelper = async () => {
    setStarting(true);
    try {
      // Ask server to open the helper app and wait until it's reachable
      const res = await fetch('/api/native/finder/start-helper', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body && body.success) {
        // Helper started; perform one immediate retry to trigger choose-file
        try {
          await onRetry();
        } catch (e) {
          // ignore; UI will still reflect that helper started
        }
      } else {
        console.warn('start-helper returned error', body);
      }
    } catch (e) {
      console.warn('start helper failed', e);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483670, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.36)' }}>
      <div style={{ width: 380, borderRadius: 16, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', padding: 18, border: '1px solid rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>{guidance.title}</h3>
        <ol style={{ marginTop: 8, marginBottom: 12, color: '#444', paddingLeft: 18 }}>
          {guidance.steps.map((s, i) => (
            <li key={i} style={{ marginBottom: 6, fontSize: 13 }}>{s}</li>
          ))}
        </ol>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleOpenSettings} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: '#0b79ff', color: '#fff', border: 'none' }}>Open System Settings</button>
          <button onClick={handleRetry} disabled={retrying} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: '#eee', border: '1px solid rgba(0,0,0,0.06)' }}>{retrying ? 'Retrying...' : 'Retry'}</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleStartHelper} disabled={starting} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: '#14a44d', color: '#fff', border: 'none' }}>{starting ? 'Starting...' : 'Start Helper'}</button>
          <button onClick={onDismiss} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(0,0,0,0.06)', color: '#666' }}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}
