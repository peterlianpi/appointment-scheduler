import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { sendEmail } from "@/features/mail/lib";
import { User } from "@/lib/generated/prisma/client";
import { emailOTP } from "better-auth/plugins";
import {
  emailTemplates,
  generateTwoFactorOtpEmail,
} from "@/features/mail/components/templates";
// If your Prisma file is located elsewhere, you can change the path

// Helper function to send 2FA OTP email
async function sendTwoFactorOtpEmail(
  email: string,
  userName: string,
  otp: string,
) {
  const { subject, html } = generateTwoFactorOtpEmail({
    name: userName,
    email,
    otp,
  });

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60, // 60 seconds
    max: 100,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: 5 },
      "/reset-password": { window: 60 * 60, max: 3 },
    },
  },
  advanced: {
    ipAddress: {
      ipv6Subnet: 64,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false, //defaults to true
    requireEmailVerification: true,
    emailVerification: {
      sendVerificationEmail: async (
        { user, url, token }: { user: User; url: string; token: string },
        request?: Request,
      ) => {
        const { subject, html } = emailTemplates.emailVerification({
          name: user.name || user.email.split("@")[0],
          email: user.email,
          verificationLink: url,
        });

        await sendEmail({
          to: user.email,
          subject,
          html,
        });
      },
      sendResetPassword: async (
        { user, url, token }: { user: User; url: string; token: string },
        request?: Request,
      ) => {
        const { subject, html } = emailTemplates.passwordReset({
          name: user.name || user.email.split("@")[0],
          email: user.email,
          resetLink: url,
        });

        await sendEmail({
          to: user.email,
          subject,
          html,
        });
      },
      onPasswordReset: async ({ user }: { user: User }, request?: Request) => {
        const { subject, html } = emailTemplates.passwordChanged({
          name: user.name || user.email.split("@")[0],
          email: user.email,
        });

        await sendEmail({
          to: user.email,
          subject,
          html,
        });
      },
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const userName = email.split("@")[0];
        await sendTwoFactorOtpEmail(email, userName, otp);
      },
    }),
  ],
});
