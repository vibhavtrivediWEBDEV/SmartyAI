import { useEffect, useState, useCallback } from 'react';
import capabilityManager, { Capability, PermissionEntry } from '@/lib/capabilityManager';

export function useCapabilityManager(pollInterval = 1000) {
  const [granted, setGranted] = useState<string[]>(() => capabilityManager.listGrantedPermissions());
  const [pending, setPending] = useState<PermissionEntry[]>(() => capabilityManager.getPendingQueue());
  const [operations, setOperations] = useState<any[]>(() => capabilityManager.getPendingOperations());
  const [cancelled, setCancelled] = useState<any[]>(() => (capabilityManager as any).getCancelledOperations ? (capabilityManager as any).getCancelledOperations() : []);

  useEffect(() => {
    const id = setInterval(() => {
      setGranted(capabilityManager.listGrantedPermissions());
      setPending(capabilityManager.getPendingQueue());
      setOperations(capabilityManager.getPendingOperations());
      setCancelled((capabilityManager as any).getCancelledOperations ? (capabilityManager as any).getCancelledOperations() : []);
    }, pollInterval);

    return () => clearInterval(id);
  }, [pollInterval]);

  const request = useCallback((caps: Capability[]) => {
    return capabilityManager.requestCapabilities(caps);
  }, []);

  const grant = useCallback((cap: Capability, persistent = false) => {
    capabilityManager.grantCapability(cap, persistent);
    setGranted(capabilityManager.listGrantedPermissions());
    setPending(capabilityManager.getPendingQueue());
    setOperations(capabilityManager.getPendingOperations());
  }, []);

  const deny = useCallback((cap: Capability) => {
    capabilityManager.denyCapability(cap);
    setPending(capabilityManager.getPendingQueue());
    setOperations(capabilityManager.getPendingOperations());
  }, []);

  const listPending = useCallback(() => capabilityManager.getPendingQueue(), []);

  const listOperations = useCallback(() => capabilityManager.getPendingOperations(), []);
  const listCancelled = useCallback(() => (capabilityManager as any).getCancelledOperations ? (capabilityManager as any).getCancelledOperations() : [], []);

  const resume = useCallback(async (opId: string) => {
    const res = await capabilityManager.resumeOperation(opId);
    setOperations(capabilityManager.getPendingOperations());
    return res;
  }, []);

  const cancel = useCallback((opId: string) => {
    const ok = capabilityManager.cancelOperation(opId);
    setOperations(capabilityManager.getPendingOperations());
    return ok;
  }, []);

  const requeue = useCallback((opId: string) => {
    try {
      const res = (capabilityManager as any).requeueCancelledOperation(opId);
      setOperations(capabilityManager.getPendingOperations());
      setCancelled((capabilityManager as any).getCancelledOperations());
      return res;
    } catch (e) {
      return { success: false, error: e };
    }
  }, []);

  return {
    granted,
    pending,
    operations,
    cancelled,
    request,
    grant,
    deny,
    listPending,
    listOperations,
    listCancelled,
    resume,
    cancel
    ,
    requeue
  };
}

export default useCapabilityManager;
