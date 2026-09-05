export type CareerProgressEvent = {
  missionId: string;
  reason: "mission" | "plan" | "task" | "resources";
  progress?: number;
  timestamp: string;
};

export type CareerLaunchEvent = {
  taskId: string;
  missionId: string;
  appName: "Start Interview" | "Smarty Teacher" | "AI Book";
  args: Record<string, string>;
  scheduledAt: string;
  timestamp: string;
};

export type CareerReminderEvent = {
  taskId: string;
  kind: "task_overdue";
  timestamp: string;
};

export function emitCareerProgress(
  userId: string,
  event: Omit<CareerProgressEvent, "timestamp">
) {
  global.socketIO?.to(`user:${userId}`).emit("career-progress", {
    ...event,
    timestamp: new Date().toISOString(),
  } satisfies CareerProgressEvent);
}

export function emitCareerLaunch(
  userId: string,
  event: Omit<CareerLaunchEvent, "timestamp">
) {
  global.socketIO?.to(`user:${userId}`).emit("career-launch", {
    ...event,
    timestamp: new Date().toISOString(),
  } satisfies CareerLaunchEvent);
}

export function emitCareerReminder(
  userId: string,
  event: Omit<CareerReminderEvent, "timestamp">
) {
  global.socketIO?.to(`user:${userId}`).emit("career-reminder", {
    ...event,
    timestamp: new Date().toISOString(),
  } satisfies CareerReminderEvent);
}