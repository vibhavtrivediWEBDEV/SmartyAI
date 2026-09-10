export type Plan = "free" | "trial" | "starter" | "pro" | "job_seeker";
export type SubscriptionStatus = "active" | "past_due" | "cancelled";
export type SubscriptionApp = "finder" | "excel";
export type BillingPeriod = "day" | "week" | "month";
export type PlanUsageMetric = "careerMissions" | "teacherBooks" | "teachingSessions" | "interviews" | "youtubeSuggestions" | "notes" | "vscodeQuestions" | "calendarEvents" | "telegramCommands";

export type PlanUsageLimits = Record<PlanUsageMetric, number>;

const GB = 1024 ** 3;

export interface SubscriptionPlan {
  id: Plan;
  name: string;
  priceInr: number;
  currency: "INR";
  billingPeriod: BillingPeriod;
  billingPeriodDays: number;
  monthlyCredits: number;
  atsCvUpdates: number;
  linkedinApplications: number;
  naukriApplications: number;
  dailyJobApplications: number | null;
  finderStorageBytes: number;
  excelOperationsPerMonth: number | null;
  tableGenerationsPerMonth: number | null;
  teacherBooksPerMonth: number;
  monthlyLimits: PlanUsageLimits;
  apps: SubscriptionApp[];
  description: string;
  features: string[];
  popular?: boolean;
  purchasable: boolean;
}

export const SUBSCRIPTION_PLANS: Record<Plan, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    priceInr: 0,
    currency: "INR",
    billingPeriod: "month",
    billingPeriodDays: 30,
    monthlyCredits: 100,
    atsCvUpdates: 0,
    linkedinApplications: 0,
    naukriApplications: 0,
    dailyJobApplications: null,
    finderStorageBytes: GB,
    apps: ["finder", "excel"],
    excelOperationsPerMonth: 10,
    tableGenerationsPerMonth: 50,
    teacherBooksPerMonth: 3,
    monthlyLimits: { careerMissions: 0, teacherBooks: 3, teachingSessions: 1, interviews: 1, youtubeSuggestions: 10, notes: 5, vscodeQuestions: 5, calendarEvents: 10, telegramCommands: 20 },
    description: "A private workspace for getting started.",
    features: ["Private Finder", "1 GB Finder storage", "Excel & CSV preview/editing", "10 Excel AI operations/month", "50 AI table generations/month", "3 AI teacher books/month", "Community support"],
    purchasable: false,
  },
  trial: {
    id: "trial",
    name: "One Day Trial",
    priceInr: 10,
    currency: "INR",
    billingPeriod: "day",
    billingPeriodDays: 1,
    monthlyCredits: 200,
    atsCvUpdates: 1,
    linkedinApplications: 0,
    naukriApplications: 0,
    dailyJobApplications: null,
    finderStorageBytes: GB,
    apps: ["finder", "excel"],
    excelOperationsPerMonth: null,
    tableGenerationsPerMonth: null,
    teacherBooksPerMonth: 3,
    monthlyLimits: { careerMissions: 1, teacherBooks: 3, teachingSessions: 2, interviews: 2, youtubeSuggestions: 20, notes: 10, vscodeQuestions: 10, calendarEvents: 20, telegramCommands: 30 },
    description: "Test the complete interview workspace for one day.",
    features: ["200 credits for one day", "ATS resume improvement", "Invisible interview window", "Custom AI response instructions"],
    purchasable: false,
  },
  starter: {
    id: "starter",
    name: "Career Starter",
    priceInr: 499,
    currency: "INR",
    billingPeriod: "month",
    billingPeriodDays: 30,
    monthlyCredits: 6000,
    atsCvUpdates: 1,
    linkedinApplications: 50,
    naukriApplications: 0,
    dailyJobApplications: null,
    finderStorageBytes: 10 * GB,
    apps: ["finder", "excel"],
    excelOperationsPerMonth: null,
    tableGenerationsPerMonth: null,
    teacherBooksPerMonth: 20,
    monthlyLimits: { careerMissions: 3, teacherBooks: 20, teachingSessions: 10, interviews: 10, youtubeSuggestions: 100, notes: 20, vscodeQuestions: 20, calendarEvents: 50, telegramCommands: 100 },
    description: "Focused monthly preparation for up to three companies.",
    features: ["3 company career plans", "20 AI books", "10 teaching sessions", "10 mock interviews", "100 YouTube suggestions", "20 notes and 20 VS Code questions", "50 calendar reminders", "100 Telegram bot commands"],
    purchasable: true,
  },
  pro: {
    id: "pro",
    name: "Notice Period",
    priceInr: 1999,
    currency: "INR",
    billingPeriod: "month",
    billingPeriodDays: 30,
    monthlyCredits: 15000,
    atsCvUpdates: 10,
    linkedinApplications: 100,
    naukriApplications: 50,
    dailyJobApplications: null,
    finderStorageBytes: 100 * GB,
    apps: ["finder", "excel"],
    excelOperationsPerMonth: null,
    tableGenerationsPerMonth: null,
    teacherBooksPerMonth: 50,
    monthlyLimits: { careerMissions: 10, teacherBooks: 50, teachingSessions: 30, interviews: 30, youtubeSuggestions: 300, notes: 100, vscodeQuestions: 100, calendarEvents: 250, telegramCommands: 500 },
    description: "A larger monthly pipeline for an active job search.",
    features: ["10 company career plans", "50 AI books", "30 teaching sessions", "30 mock interviews", "300 YouTube suggestions", "100 notes and 100 VS Code questions", "250 calendar reminders", "500 Telegram bot commands"],
    popular: true,
    purchasable: true,
  },
  job_seeker: {
    id: "job_seeker",
    name: "Job Seeker",
    priceInr: 9999,
    currency: "INR",
    billingPeriod: "month",
    billingPeriodDays: 30,
    monthlyCredits: 300000,
    atsCvUpdates: 50,
    linkedinApplications: 1000,
    naukriApplications: 100,
    dailyJobApplications: 20,
    finderStorageBytes: 100 * GB,
    apps: ["finder", "excel"],
    excelOperationsPerMonth: null,
    tableGenerationsPerMonth: null,
    teacherBooksPerMonth: 200,
    monthlyLimits: { careerMissions: 50, teacherBooks: 200, teachingSessions: 100, interviews: 100, youtubeSuggestions: 1000, notes: 500, vscodeQuestions: 500, calendarEvents: 1000, telegramCommands: 5000 },
    description: "Full-day interview practice and managed job search.",
    features: ["50 company career plans", "200 AI books", "100 teaching sessions", "100 mock interviews", "1,000 YouTube suggestions", "500 notes and 500 VS Code questions", "1,000 calendar reminders", "5,000 Telegram bot commands"],
    purchasable: true,
  },
};

export const PURCHASABLE_PLANS = Object.values(SUBSCRIPTION_PLANS).filter(
  (plan) => plan.purchasable,
);

export function hasSubscriptionApp(
  plan: Plan,
  status: SubscriptionStatus,
  app: SubscriptionApp,
): boolean {
  return status === "active" && SUBSCRIPTION_PLANS[plan].apps.includes(app);
}
