import type { CreateIncidentInput } from "./types";

const QUEUE_KEY = "tabang-daet-offline-queue";

export type QueuedReport = CreateIncidentInput & { queuedAt: string };

export function loadOfflineQueue(): QueuedReport[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedReport[]) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedReport[]): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueOfflineReport(report: CreateIncidentInput): void {
  const queue = loadOfflineQueue();
  queue.push({ ...report, queuedAt: new Date().toISOString() });
  saveOfflineQueue(queue);
}

export async function flushOfflineQueue(
  submit: (report: CreateIncidentInput) => Promise<void>,
): Promise<number> {
  const queue = loadOfflineQueue();
  if (queue.length === 0) {
    return 0;
  }

  let sent = 0;
  const remaining: QueuedReport[] = [];

  for (const item of queue) {
    try {
      const { queuedAt: _, ...report } = item;
      await submit(report);
      sent += 1;
    } catch {
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  return sent;
}
