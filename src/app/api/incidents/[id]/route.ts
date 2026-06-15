import { prisma } from "@/lib/db";
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
  try {
    const { id } = await context.params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        timeline: {
          orderBy: {
            at: "asc",
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const formattedIncident = {
      ...incident,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
      timeline: incident.timeline.map((evt) => ({
        ...evt,
        at: evt.at.toISOString(),
      })),
    };

    return NextResponse.json(formattedIncident);
  } catch (error) {
    console.error(`Error fetching incident ${error}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch incident" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as PatchBody;

    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // Determine timeline changes and update details
    let timelineTitle = "";
    let timelineDetail = "";
    const updateData: any = {
      status: body.status,
    };

    switch (body.status) {
      case "validated":
        timelineTitle = "Report Validated";
        timelineDetail = "Dispatcher confirmed your photo and GPS location.";
        break;
      case "dispatched": {
        const unit = body.assignedUnit ?? "MDRRMO Responder";
        const eta = body.etaMinutes ?? 8;
        updateData.assignedUnit = unit;
        updateData.etaMinutes = eta;
        timelineTitle = "Unit Dispatched";
        timelineDetail = `${unit} is en route. Estimated arrival: ${eta} minutes.`;
        break;
      }
      case "on_scene":
        timelineTitle = "Responders On Scene";
        timelineDetail = "Emergency personnel have arrived at your pinned location.";
        break;
      case "resolved":
        timelineTitle = "Incident Resolved";
        timelineDetail = "The case has been closed. Thank you for reporting through Tabang Daet.";
        break;
      default:
        break;
    }

    // Execute database updates in a transaction
    const updatedIncident = await prisma.$transaction(async (tx) => {
      const updated = await tx.incident.update({
        where: { id },
        data: updateData,
      });

      if (timelineTitle) {
        await tx.timelineEvent.create({
          data: {
            incidentId: id,
            title: timelineTitle,
            detail: timelineDetail,
          },
        });
      }

      return tx.incident.findUnique({
        where: { id },
        include: {
          timeline: {
            orderBy: {
              at: "asc",
            },
          },
        },
      });
    });

    if (!updatedIncident) {
      return NextResponse.json({ error: "Failed to load updated incident" }, { status: 500 });
    }

    const formattedIncident = {
      ...updatedIncident,
      createdAt: updatedIncident.createdAt.toISOString(),
      updatedAt: updatedIncident.updatedAt.toISOString(),
      timeline: updatedIncident.timeline.map((evt) => ({
        ...evt,
        at: evt.at.toISOString(),
      })),
    };

    return NextResponse.json(formattedIncident);
  } catch (error) {
    console.error(`Error updating incident:`, error);
    return NextResponse.json(
      { error: "Failed to update incident" },
      { status: 500 },
    );
  }
}
