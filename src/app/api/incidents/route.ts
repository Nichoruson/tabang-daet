import { prisma } from "@/lib/db";
import { inferSeverity } from "@/lib/triage";
import { createIncidentId } from "@/lib/incident-service";
import type { CreateIncidentInput } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      include: {
        timeline: {
          orderBy: {
            at: "asc",
          },
        },
      },
    });

    // Map Prisma models to match IncidentReport TypeScript shape if needed (serialize dates)
    const formattedIncidents = incidents.map((inc) => ({
      ...inc,
      createdAt: inc.createdAt.toISOString(),
      updatedAt: inc.updatedAt.toISOString(),
      timeline: inc.timeline.map((evt) => ({
        ...evt,
        at: evt.at.toISOString(),
      })),
    }));

    // Sort by status priority and severity priority
    const severityRank: Record<string, number> = {
      critical: 0,
      high: 1,
      moderate: 2,
      low: 3,
    };
    const statusRank: Record<string, number> = {
      pending: 0,
      validated: 1,
      dispatched: 2,
      on_scene: 3,
      resolved: 4,
    };

    formattedIncidents.sort((a, b) => {
      if (statusRank[a.status] !== statusRank[b.status]) {
        return statusRank[a.status] - statusRank[b.status];
      }
      return severityRank[a.severity] - severityRank[b.severity];
    });

    return NextResponse.json(formattedIncidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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

    // Ensure the reporter user exists in the database (create if missing)
    await prisma.user.upsert({
      where: { phone: body.reporterPhone },
      update: { name: body.reporterName },
      create: {
        id: body.reporterId,
        name: body.reporterName,
        phone: body.reporterPhone,
        role: "citizen",
        authMethod: "phone",
      },
    });

    const severity = inferSeverity(body.category, body.description);
    const incidentId = createIncidentId();

    // Create incident with initial timeline event in a transaction
    const incident = await prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: {
          id: incidentId,
          category: body.category,
          severity,
          status: "pending",
          reporterId: body.reporterId,
          reporterName: body.reporterName,
          reporterPhone: body.reporterPhone,
          description: body.description,
          landmark: body.landmark,
          latitude: body.latitude,
          longitude: body.longitude,
          photoDataUrl: body.photoDataUrl,
        },
      });

      const timelineEvent = await tx.timelineEvent.create({
        data: {
          incidentId,
          title: "Report Received",
          detail: "Your emergency report reached the MDRRMO command center.",
        },
      });

      return {
        ...created,
        timeline: [timelineEvent],
      };
    });

    const formattedIncident = {
      ...incident,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
      timeline: incident.timeline.map((evt) => ({
        ...evt,
        at: evt.at.toISOString(),
      })),
    };

    return NextResponse.json(formattedIncident, { status: 201 });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 },
    );
  }
}
