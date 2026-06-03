import { promises as fs } from "fs";
import path from "path";
import type { IncidentReport } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "incidents.json");

/** In-memory store for serverless hosts (Vercel) where the filesystem is read-only. */
const globalStore = globalThis as typeof globalThis & {
  __tabangIncidents?: IncidentReport[];
};

function readMemory(): IncidentReport[] {
  return globalStore.__tabangIncidents ?? [];
}

function writeMemory(incidents: IncidentReport[]): void {
  globalStore.__tabangIncidents = incidents;
}

function useMemoryOnly(): boolean {
  return process.env.VERCEL === "1" || process.env.TABANG_USE_MEMORY === "1";
}

export async function readIncidentsFromDisk(): Promise<IncidentReport[]> {
  if (useMemoryOnly()) {
    return readMemory();
  }

  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as IncidentReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return readMemory();
  }
}

export async function writeIncidentsToDisk(
  incidents: IncidentReport[],
): Promise<void> {
  writeMemory(incidents);

  if (useMemoryOnly()) {
    return;
  }

  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(incidents, null, 2), "utf-8");
  } catch {
    /* File write failed (e.g. read-only FS) — memory store already updated */
  }
}
