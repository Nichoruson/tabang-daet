import {
  buildNewIncident,
  sortIncidentsByPriority,
} from "@/lib/incident-service";
import { readIncidentsFromDisk, writeIncidentsToDisk } from "@/lib/persistence";
import type { CreateIncidentInput } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const incidents = await readIncidentsFromDisk();
  return NextResponse.json(sortIncidentsByPriority(incidents));
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateIncidentInput;
  const required = [
    "category",
    "reporterId",
    "reporterName",
    "reporterPhone",
    "description",
    "latitude",
    "longitude",
  ] as const;

  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === "") {
      return NextResponse.json(
        { error: `Missing required field: ${key}` },
        { status: 400 },
      );
    }
  }

  if (!body.photoDataUrl) {
    return NextResponse.json(
      { error: "A live incident photo is required." },
      { status: 400 },
    );
  }

  const incidents = await readIncidentsFromDisk();
  const incident = buildNewIncident(body);
  incidents.unshift(incident);
  await writeIncidentsToDisk(incidents);

  return NextResponse.json(incident, { status: 201 });
}
