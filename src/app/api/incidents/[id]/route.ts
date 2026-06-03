import { transitionIncident } from "@/lib/incident-service";
import { readIncidentsFromDisk, writeIncidentsToDisk } from "@/lib/persistence";
import type { IncidentStatus } from "@/lib/types";
import { NextResponse } from "next/server";

type PatchBody = {
  status: IncidentStatus;
  assignedUnit?: string;
  etaMinutes?: number;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const incidents = await readIncidentsFromDisk();
  const incident = incidents.find((item) => item.id === id);

  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  return NextResponse.json(incident);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;

  if (!body.status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const incidents = await readIncidentsFromDisk();
  const index = incidents.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  incidents[index] = transitionIncident(incidents[index], body.status, {
    assignedUnit: body.assignedUnit,
    etaMinutes: body.etaMinutes,
  });

  await writeIncidentsToDisk(incidents);
  return NextResponse.json(incidents[index]);
}
