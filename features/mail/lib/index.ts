import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // Use TLS/SSL for port 465, otherwise STARTTLS
  requireTLS: process.env.SMTP_PORT !== "465",
  auth: {
    user: process.env.SMTP_USER || "your-ethereal-user@ethereal.email",
    pass: process.env.SMTP_PASS || "your-ethereal-password",
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: process.env.NODE_ENV === "development",
  logger: process.env.NODE_ENV === "development",
});

// Verify transporter connection on module load (in development)
if (process.env.NODE_ENV === "development") {
  transporter
    .verify()
    .then(() => {
      console.log("[Mail] SMTP transporter is ready to send emails");
    })
    .catch((error: Error) => {
      console.error(
        "[Mail] SMTP transporter verification failed:",
        error.message,
      );
    });
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  if (!process.env.SMTP_FROM) {
    const errorMsg =
      "SMTP_FROM environment variable is not set. Please set it to a valid email address.";
    console.error("[Mail] Error:", errorMsg);
    throw new Error(errorMsg);
  }

  try {
    console.log(`[Mail] Sending email to: ${to}`);
    console.log(`[Mail] Subject: ${subject}`);

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Mail] Email sent successfully!`);
    console.log(`[Mail] Message ID: ${info.messageId}`);

    // In development, log the preview URL if using Ethereal
    if (process.env.NODE_ENV === "development" && info.messageId) {
      console.log(
        `[Mail] Preview URL (Ethereal): https://ethereal.email/message/${info.messageId}`,
      );
    }

    return info;
  } catch (error) {
    console.error("[Mail] Failed to send email:");
    console.error(
      "[Mail] Error name:",
      error instanceof Error ? error.name : "Unknown",
    );
    console.error(
      "[Mail] Error message:",
      error instanceof Error ? error.message : String(error),
    );
    if (error instanceof Error && "code" in error) {
      console.error("[Mail] Error code:", (error as { code?: string }).code);
    }
    throw error;
  }
}
