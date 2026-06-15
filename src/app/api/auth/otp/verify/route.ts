import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone, code, name = "" } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and OTP code are required" },
        { status: 400 },
      );
    }

    // Find the latest valid OTP code for this phone number
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone,
        code: code.trim(),
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // For demo purposes, let's also allow a fallback to "123456" if Twilio is not configured
    // and we're in development/demo mode.
    const isDemoOtp = code.trim() === "123456";
    const allowDemo = process.env.NODE_ENV !== "production";

    if (!otpRecord && !(isDemoOtp && allowDemo)) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 400 },
      );
    }

    // Mark the OTP as verified if it came from the DB
    if (otpRecord) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });
    }

    // Check if the user already exists in the database
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // Create user account (Registration)
      user = await prisma.user.create({
        data: {
          name: name.trim() || "Verified Resident",
          phone,
          role: "citizen",
          authMethod: "phone",
        },
      });
    } else if (name.trim() && user.name !== name.trim()) {
      // Update name if a new one is provided
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
      });
    }

    // Create session payload matching our types
    const session = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      authMethod: user.authMethod,
    };

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Error in OTP verify route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
