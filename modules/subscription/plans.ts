export type Plan = "free" | "starter" | "pro";
export type SubscriptionStatus = "active" | "past_due" | "cancelled";
export type SubscriptionApp = "finder" | "excel";

const GB = 1024 ** 3;

export interface SubscriptionPlan {
  id: Plan;
  name: string;
  priceMonthly: number;
  currency: "USD";
  finderStorageBytes: number;
  excelOperationsPerMonth: number | null;
  tableGenerationsPerMonth: number | null;
  teacherBooksPerMonth: number;
  apps: SubscriptionApp[];
  description: string;
  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<Plan, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    currency: "USD",
    finderStorageBytes: GB,
    apps: ["finder", "excel"],
    excelOperationsPerMonth: 10,
    tableGenerationsPerMonth: 50,
    teacherBooksPerMonth: 3,
    description: "A private workspace for getting started.",
    features: ["Private Finder", "1 GB Finder storage", "Excel & CSV preview/editing", "10 Excel AI operations/month", "50 AI table generations/month", "3 AI teacher books/month", "Community support"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 9,
    currency: "USD",
    finderStorageBytes: 10 * GB,
    apps: ["finder", "excel"],
    excelOperationsPerMonth: null,
    tableGenerationsPerMonth: null,
    teacherBooksPerMonth: 10,
    description: "More space for individual projects.",
    features: ["Everything in Free", "10 GB Finder storage", "Unlimited Excel AI operations", "10 AI teacher books/month", "Multi-sheet Excel creation", "Email support"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 24,
    currency: "USD",
    finderStorageBytes: 100 * GB,
    apps: ["finder", "excel"],
    excelOperationsPerMonth: null,
    tableGenerationsPerMonth: null,
    teacherBooksPerMonth: 20,
    description: "High-capacity storage for power users.",
    features: ["Everything in Starter", "100 GB Finder storage", "Unlimited Excel AI operations", "20 AI teacher books/month", "Advanced workbook generation", "Priority support"],
    popular: true,
  },
};

export function hasSubscriptionApp(
  plan: Plan,
  status: SubscriptionStatus,
  app: SubscriptionApp,
): boolean {
  return status === "active" && SUBSCRIPTION_PLANS[plan].apps.includes(app);
}
