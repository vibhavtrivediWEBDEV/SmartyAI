import { SUBSCRIPTION_PLANS, type Plan } from "../subscription/plans";

export type { Plan } from "../subscription/plans";
export type StorageKind = "file" | "text";

export interface StorageUsage {
  fileBytesUsed: number;
  fileBytesReserved: number;
  textBytesUsed: number;
  textBytesReserved: number;
}

export const PLAN_STORAGE_LIMITS: Record<Plan, Record<StorageKind, number>> = {
  free: { file: SUBSCRIPTION_PLANS.free.finderStorageBytes, text: SUBSCRIPTION_PLANS.free.finderStorageBytes },
  starter: { file: SUBSCRIPTION_PLANS.starter.finderStorageBytes, text: SUBSCRIPTION_PLANS.starter.finderStorageBytes },
  pro: { file: SUBSCRIPTION_PLANS.pro.finderStorageBytes, text: SUBSCRIPTION_PLANS.pro.finderStorageBytes },
};

export function getStorageLimit(plan: Plan, _kind?: StorageKind): number {
  return SUBSCRIPTION_PLANS[plan].finderStorageBytes;
}

export function canReserveStorage(
  plan: Plan,
  kind: StorageKind,
  requestedBytes: number,
  usage: StorageUsage,
): { allowed: boolean; remainingBytes: number } {
  if (!Number.isSafeInteger(requestedBytes) || requestedBytes <= 0) {
    return { allowed: false, remainingBytes: 0 };
  }

  const used = usage.fileBytesUsed + usage.textBytesUsed;
  const reserved = usage.fileBytesReserved + usage.textBytesReserved;
  const remainingBeforeReservation = Math.max(0, getStorageLimit(plan) - used - reserved);

  return {
    allowed: requestedBytes <= remainingBeforeReservation,
    remainingBytes: requestedBytes <= remainingBeforeReservation
      ? remainingBeforeReservation - requestedBytes
      : remainingBeforeReservation,
  };
}
