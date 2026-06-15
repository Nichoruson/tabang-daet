import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(request: Request) {
  try {
    const { phone, purpose = "login" } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Save the OTP to the database
    await prisma.otpCode.create({
      data: {
        phone,
        code,
        purpose,
        expiresAt,
        verified: false,
      },
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    let sentViaSms = false;

    if (accountSid && authToken && fromPhone) {
      try {
        const client = twilio(accountSid, authToken);
        await client.messages.create({
          body: `Tabang Daet: Your verification code is ${code}. It expires in 5 minutes.`,
          from: fromPhone,
          to: phone,
        });
        sentViaSms = true;
      } catch (smsError) {
        console.error("Failed to send SMS via Twilio:", smsError);
      }
    }

    // Always log to the console for debugging/development fallback
    console.log(
      `\n--- [OTP SERVICE] ---\nPhone: ${phone}\nCode: ${code}\nPurpose: ${purpose}\n---------------------\n`,
    );

    // In non-production environments (or if SMS is disabled), return the code in the response
    // so the developer/user can use it without configuring Twilio.
    const isProd = process.env.NODE_ENV === "production";
    const responsePayload: { message: string; code?: string } = {
      message: sentViaSms
        ? "OTP sent via SMS."
        : "OTP logged to server console (Twilio not configured).",
    };

    if (!sentViaSms || !isProd) {
      responsePayload.code = code;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error in OTP send route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
