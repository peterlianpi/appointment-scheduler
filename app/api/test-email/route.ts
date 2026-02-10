import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/features/mail/lib";
import {
  emailTemplates,
  generateTwoFactorOtpEmail,
} from "@/features/mail/components/templates";

export async function POST(request: NextRequest) {
  try {
    const { type, email } = await request.json();

    const testEmail =
      email || process.env.TEST_SEND_TO_MAIL || "test@example.com";

    console.log(`[Test Email] Testing ${type || "all"} email template(s)...`);

    const results: {
      type: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }[] = [];

    // Test 1: Email Verification Template
    if (!type || type === "verification") {
      const { subject, html } = emailTemplates.emailVerification({
        name: "Test User",
        email: testEmail,
        verificationLink: "https://example.com/verify?token=test123",
      });

      const verificationResult = await sendEmail({
        to: testEmail,
        subject,
        html,
      });

      results.push({
        type: "emailVerification",
        success: true,
        messageId: verificationResult.messageId,
      });
    }

    // Test 2: Password Reset Template
    if (!type || type === "passwordReset") {
      const { subject, html } = emailTemplates.passwordReset({
        name: "Test User",
        email: testEmail,
        resetLink: "https://example.com/reset?token=test123",
      });

      const resetResult = await sendEmail({
        to: testEmail,
        subject,
        html,
      });

      results.push({
        type: "passwordReset",
        success: true,
        messageId: resetResult.messageId,
      });
    }

    // Test 3: Password Changed Template
    if (!type || type === "passwordChanged") {
      const { subject, html } = emailTemplates.passwordChanged({
        name: "Test User",
        email: testEmail,
      });

      const changedResult = await sendEmail({
        to: testEmail,
        subject,
        html,
      });

      results.push({
        type: "passwordChanged",
        success: true,
        messageId: changedResult.messageId,
      });
    }

    // Test 4: Two-Factor OTP Template
    if (!type || type === "twoFactorOtp") {
      const { subject, html } = generateTwoFactorOtpEmail({
        name: "Test User",
        email: testEmail,
        otp: "123456",
      });

      const otpResult = await sendEmail({
        to: testEmail,
        subject,
        html,
      });

      results.push({
        type: "twoFactorOtp",
        success: true,
        messageId: otpResult.messageId,
      });
    }

    // Test 5: Welcome Template
    if (!type || type === "welcome") {
      const { subject, html } = emailTemplates.welcome({
        name: "Test User",
        email: testEmail,
      });

      const welcomeResult = await sendEmail({
        to: testEmail,
        subject,
        html,
      });

      results.push({
        type: "welcome",
        success: true,
        messageId: welcomeResult.messageId,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully tested ${results.length} email template(s)`,
      results,
      testEmail,
      previewNote:
        process.env.NODE_ENV === "development"
          ? "Check server console for Ethereal preview URLs"
          : "Check your email inbox",
    });
  } catch (error) {
    console.error("[Test Email] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
