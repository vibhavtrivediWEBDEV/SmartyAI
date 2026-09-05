import { runCareerAutomationFromEnvironment, type CareerAutomationResult } from "./careerAutomation";

const SCHEDULER_INTERVAL_MS = 60 * 1000;

export class CareerScheduler {
  private static instance: CareerScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;

  static getInstance(): CareerScheduler {
    CareerScheduler.instance ||= new CareerScheduler();
    return CareerScheduler.instance;
  }

  start(): void {
    if (this.intervalId) return;
    this.run().catch((error) => console.error("Initial Career Scheduler run failed:", error));
    this.intervalId = setInterval(() => {
      this.run().catch((error) => console.error("Career Scheduler error:", error));
    }, SCHEDULER_INTERVAL_MS);
    this.intervalId.unref?.();
    console.log("[Career Scheduler] Started with a 60-second interval");
  }

  stop(): void {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  async run(): Promise<CareerAutomationResult | null> {
    if (this.running) return null;
    this.running = true;
    try {
      return await runCareerAutomationFromEnvironment();
    } finally {
      this.running = false;
    }
  }
}

export function startCareerScheduler(): void {
  CareerScheduler.getInstance().start();
}

export function stopCareerScheduler(): void {
  CareerScheduler.getInstance().stop();
}
