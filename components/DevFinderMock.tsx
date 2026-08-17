import React, { useRef, useEffect } from 'react';

// Dev-only Finder mock: opens a hidden <input type="file"> and dispatches
// `capability:finderSelected` with a synthetic filePath for testing queued ops.
export default function DevFinderMock() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingOperationIdsRef = useRef<string[] | undefined>(undefined);

  useEffect(() => {
    const handleOpenClaw = (ev: Event) => {
      const detail = (ev as CustomEvent<any>).detail || {};
      const opId = detail?.operationId || detail?.opId;
      const opIds = detail?.operationIds || detail?.ops || detail?.opIds;
      // remember operation ids so we include them in the finderSelected event
      pendingOperationIdsRef.current = opIds || (opId ? [opId] : undefined);
      // click the hidden file input
      try {
        if (inputRef.current) inputRef.current.click();
      } catch (e) {
        console.warn('[DevFinderMock] failed to open file input', e);
      }
    };

    window.addEventListener('capability:userOPENCLAW', handleOpenClaw as EventListener);
    return () => window.removeEventListener('capability:userOPENCLAW', handleOpenClaw as EventListener);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    // Browsers don't give full path; create a synthetic path for testing
    const syntheticPath = `/Users/test/Downloads/${f.name}`;
    const detail: any = { filePath: syntheticPath };
    if (pendingOperationIdsRef.current) detail.operationIds = pendingOperationIdsRef.current;
    // dispatch finderSelected event
    try {
      window.dispatchEvent(new CustomEvent('capability:finderSelected', { detail }));
      console.log('[DevFinderMock] dispatched capability:finderSelected', detail);
    } catch (e) {
      console.warn('[DevFinderMock] dispatch failed', e);
    }
    // clear
    pendingOperationIdsRef.current = undefined;
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <input
      ref={inputRef}
      type="file"
      style={{ display: 'none' }}
      onChange={handleChange}
      // allow multiple? keep single for simplicity
    />
  );
}
