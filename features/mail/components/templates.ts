import { getAppUrl, getAppName } from "@/lib/utils/domain";

interface EmailTemplateData {
  name: string;
  email: string;
  resetToken?: string;
  resetLink?: string;
  verificationLink?: string;
  actionUrl?: string;
  actionText?: string;
}

// Base email template wrapper
const createEmailTemplate = (
  headerTitle: string,
  headerEmoji: string,
  content: string,
  subject: string,
  footerText?: string,
  includeProfilePicture?: boolean,
  profilePictureUrl?: string,
) => {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 40px 30px; background: #ffffff; }
    .content h2 { margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; }
    .content p { margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3); transition: all 0.2s ease; }
    .button:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4); }
    .secondary-button { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; box-shadow: none; }
    .secondary-button:hover { background: #e2e8f0; }
    .code { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 20px; font-weight: bold; color: #667eea; background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #e2e8f0; }
    .link { word-break: break-all; background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; font-family: monospace; font-size: 14px; }
    .divider { height: 1px; background: #e2e8f0; margin: 32px 0; border: none; }
    .footer { text-align: center; padding: 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 0; color: #64748b; font-size: 14px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .warning p { margin: 0; color: #92400e; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; border-radius: 8px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
      .content h2 { font-size: 20px; }
    }
  `;

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>${subject}</title>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${headerEmoji} ${headerTitle}</h1>
              <p>${getAppName()}</p>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>${footerText || `This email was sent to you because you have an account with ${getAppName()}.`}</p>
              <p style="margin-top: 8px;">© ${new Date().getFullYear()} ${getAppName()}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

export const emailTemplates = {
  // Password Reset Email
  passwordReset: ({ name, email, resetLink }: EmailTemplateData) => {
    const content = `
      <h2>Hello ${name || "there"},</h2>
      <p>You recently requested to reset your password for your ${getAppName()} account. No worries, it happens to the best of us!</p>

      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Your Password</a>
      </div>

      <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
      <div class="link">${resetLink}</div>

      <div class="warning">
        <p><strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.</p>
      </div>

      <hr class="divider">

      <p style="color: #64748b; font-size: 14px;">
        Having trouble? Contact our support team for assistance.
      </p>
    `;

    return createEmailTemplate(
      "Password Reset",
      "🔐",
      content,
      `Reset your ${getAppName()} password`,
      `This email was sent to ${email}`,
    );
  },

  // Email Verification
  emailVerification: ({ name, email, verificationLink }: EmailTemplateData) => {
    const content = `
      <h2>Welcome ${name || `to ${getAppName()}`}!</h2>
      <p>Thank you for creating an account with ${getAppName()}. To get started, please verify your email address by clicking the button below.</p>

      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Your Email</a>
      </div>

      <p>If the button doesn't work, copy and paste this link:</p>
      <div class="link">${verificationLink}</div>

      <p>Once verified, you'll have full access to all features of our platform.</p>

      <div class="warning">
        <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
      </div>
    `;

    return createEmailTemplate(
      "Verify Your Email",
      "✉️",
      content,
      `Verify your ${getAppName()} account`,
      `This email was sent to ${email}`,
    );
  },

  // Welcome Email
  welcome: ({ name, email }: EmailTemplateData) => {
    const appUrl = getAppUrl();
    const logoUrl = `${appUrl}/logo.jpg`;

    const content = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${logoUrl}" alt="${getAppName()} Logo" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid #764ba2; object-fit: cover;">
      </div>
      <h2 style="text-align: center;">Welcome aboard, ${name}!</h2>
      <p style="text-align: center; font-size: 18px; color: #475569; margin-bottom: 30px;">Your ${getAppName()} account has been successfully created and verified. You're all set to start exploring!</p>

      <div style="text-align: center;">
        <a href="${appUrl}/dashboard/settings" class="button">Go to Your Profile</a>
      </div>

      <p>Here's what you can do next:</p>
      <ul style="padding-left: 20px;">
        <li>Complete your profile information</li>
        <li>Explore available features and tools</li>
        <li>Connect with other users</li>
        <li>Set up your preferences and notifications</li>
      </ul>

      <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
    `;

    return createEmailTemplate(
      "Welcome!",
      "🎉",
      content,
      `Welcome to ${getAppName()}!`,
      `This email was sent to ${email}`,
    );
  },

  // Password Changed Notification
  passwordChanged: ({ name, email }: EmailTemplateData) => {
    const appUrl = getAppUrl();
    const content = `
      <h2>Password Changed Successfully</h2>
      <p>Hi ${name},</p>
      <p>Your password for ${getAppName()} has been successfully changed. If you made this change, no further action is required.</p>

      <div class="warning">
        <p><strong>Security Alert:</strong> If you didn't make this change, please contact our support team immediately and consider changing your password from a secure device.</p>
      </div>

      <div style="text-align: center;">
        <a href="${appUrl}/auth/login" class="secondary-button">Sign In to Your Account</a>
      </div>

      <p>For your security, we recommend:</p>
      <ul style="padding-left: 20px;">
        <li>Using a strong, unique password</li>
        <li>Enabling two-factor authentication when available</li>
        <li>Regularly monitoring your account activity</li>
      </ul>
    `;

    return createEmailTemplate(
      "Password Changed",
      "🛡️",
      content,
      `Your ${getAppName()} password has been changed`,
      `This email was sent to ${email}`,
    );
  },
};

// Helper function to generate 2FA OTP email with dynamic OTP
export function generateTwoFactorOtpEmail({
  name,
  email,
  otp,
}: EmailTemplateData & { otp: string }) {
  const appUrl = getAppUrl();
  const appName = getAppName();

  const content = `
    <h2>Two-Factor Authentication Code</h2>
    <p>Hi ${name || email.split("@")[0]},</p>
    <p>Your verification code for ${appName} is:</p>

    <div class="code" style="font-size: 32px; letter-spacing: 8px; padding: 24px;">${otp}</div>

    <div class="warning">
      <p><strong>Important:</strong> This code will expire in 10 minutes for your security.</p>
      <p><strong>Don't share this code</strong> with anyone, including ${appName} support.</p>
    </div>

    <p>If you didn't request this code, please ignore this email.</p>
  `;

  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 40px 30px; background: #ffffff; }
    .content h2 { margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; }
    .content p { margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; }
    .code { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 32px; font-weight: bold; color: #667eea; background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0; letter-spacing: 8px; border: 2px dashed #e2e8f0; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .warning p { margin: 0; color: #92400e; font-size: 14px; }
    .footer { text-align: center; padding: 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 0; color: #64748b; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 10px; border-radius: 8px; }
      .header, .content, .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
      .content h2 { font-size: 20px; }
      .code { font-size: 24px; letter-spacing: 4px; }
    }
  `;

  return {
    subject: `Your ${appName} verification code`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>Verification Code</title>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verify Your Identity</h1>
              <p>${appName}</p>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>This email was sent to ${email}</p>
              <p style="margin-top: 8px;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// ============================================
// APPOINTMENT EMAIL TEMPLATES
// ============================================

export interface AppointmentEmailData {
  name: string;
  email: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  duration: number;
  location?: string;
  meetingUrl?: string;
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Appointment email styles (inline for email compatibility)
const appointmentStyles = `
  .appointment-card { background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #667eea; }
  .appointment-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
  .appointment-detail { display: flex; align-items: center; margin-bottom: 12px; }
  .appointment-detail-icon { width: 24px; margin-right: 12px; font-size: 16px; }
  .appointment-detail-text { font-size: 15px; color: #475569; }
  .appointment-description { background: #ffffff; border-radius: 8px; padding: 16px; margin-top: 16px; font-size: 14px; color: #64748b; border: 1px solid #e2e8f0; }
  .appointment-buttons { text-align: center; margin: 32px 0; }
  .appointment-button { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px; }
  .status-badge { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 20px; font-size: 12px; font-weight: 600; }
`;

// Appointment Confirmation Email
export function generateAppointmentConfirmationEmail(data: AppointmentEmailData) {
  const appUrl = getAppUrl();
  const appName = getAppName();

  const content = `
    <h2>Appointment Confirmed! ✅</h2>
    <p>Hi ${data.name},</p>
    <p>Your appointment has been successfully scheduled. Here are the details:</p>

    <div class="appointment-card">
      <div class="appointment-title">${data.title}</div>
      <div class="appointment-detail">
        <span class="appointment-detail-icon">📅</span>
        <span class="appointment-detail-text"><strong>${formatDateTime(data.startDateTime)}</strong></span>
      </div>
      <div class="appointment-detail">
        <span class="appointment-detail-icon">⏱️</span>
        <span class="appointment-detail-text">${data.duration} minutes (${formatTime(data.startDateTime)} - ${formatTime(data.endDateTime)})</span>
      </div>
      ${data.location ? `
      <div class="appointment-detail">
        <span class="appointment-detail-icon">📍</span>
        <span class="appointment-detail-text">${data.location}</span>
      </div>
      ` : ""}
      ${data.meetingUrl ? `
      <div class="appointment-detail">
        <span class="appointment-detail-icon">🔗</span>
        <span class="appointment-detail-text"><a href="${data.meetingUrl}" style="color: #667eea;">Join Meeting</a></span>
      </div>
      ` : ""}
      ${data.description ? `
      <div class="appointment-description">
        <strong>Description:</strong><br>
        ${data.description}
      </div>
      ` : ""}
    </div>

    <div class="appointment-buttons">
      <a href="${appUrl}/dashboard" class="appointment-button">View in Dashboard</a>
    </div>

    <div class="warning">
      <p><strong>Reminder:</strong> You'll receive a reminder email 24 hours before your appointment.</p>
    </div>

    <p style="color: #64748b; font-size: 14px;">
      Need to reschedule or cancel? Visit your dashboard to manage your appointment.
    </p>
  `;

  return createEmailTemplate(
    "Appointment Confirmed",
    "📅",
    content,
    `Appointment Confirmed: ${data.title} on ${formatDate(data.startDateTime)}`,
    `This email was sent to ${data.email}`,
  );
}

// Appointment Reminder Email
export function generateAppointmentReminderEmail(data: AppointmentEmailData) {
  const appUrl = getAppUrl();
  const appName = getAppName();

  // Calculate hours until appointment
  const hoursUntil = Math.round(
    (data.startDateTime.getTime() - Date.now()) / (1000 * 60 * 60),
  );

  const content = `
    <h2>Appointment Reminder ⏰</h2>
    <p>Hi ${data.name},</p>
    <p>You have an appointment coming up in <strong>${hoursUntil} hours</strong>!</p>

    <div class="appointment-card">
      <div class="appointment-title">${data.title}</div>
      <div class="appointment-detail">
        <span class="appointment-detail-icon">📅</span>
        <span class="appointment-detail-text"><strong>${formatDateTime(data.startDateTime)}</strong></span>
      </div>
      <div class="appointment-detail">
        <span class="appointment-detail-icon">⏱️</span>
        <span class="appointment-detail-text">${data.duration} minutes (${formatTime(data.startDateTime)} - ${formatTime(data.endDateTime)})</span>
      </div>
      ${data.location ? `
      <div class="appointment-detail">
        <span class="appointment-detail-icon">📍</span>
        <span class="appointment-detail-text">${data.location}</span>
      </div>
      ` : ""}
      ${data.meetingUrl ? `
      <div class="appointment-detail">
        <span class="appointment-detail-icon">🔗</span>
        <span class="appointment-detail-text"><a href="${data.meetingUrl}" style="color: #667eea;">Join Meeting</a></span>
      </div>
      ` : ""}
      ${data.description ? `
      <div class="appointment-description">
        <strong>Description:</strong><br>
        ${data.description}
      </div>
      ` : ""}
    </div>

    <div class="appointment-buttons">
      <a href="${appUrl}/dashboard" class="appointment-button">View Details</a>
    </div>

    <div class="warning">
      <p><strong>Important:</strong> Please ensure you're available at the scheduled time. If you need to reschedule, do so as soon as possible.</p>
    </div>
  `;

  return createEmailTemplate(
    "Appointment Reminder",
    "⏰",
    content,
    `Reminder: ${data.title} tomorrow at ${formatTime(data.startDateTime)}`,
    `This email was sent to ${data.email}`,
  );
}

// Appointment Rescheduled Email
export function generateAppointmentRescheduledEmail(
  data: AppointmentEmailData & { oldStartDateTime?: Date; oldEndDateTime?: Date },
) {
  const appUrl = getAppUrl();
  const appName = getAppName();

  const oldDateText = data.oldStartDateTime
    ? formatDateTime(data.oldStartDateTime)
    : "the original time";

  const content = `
    <h2>Appointment Rescheduled 🔄</h2>
    <p>Hi ${data.name},</p>
    <p>Your appointment has been rescheduled from <strong>${oldDateText}</strong> to:</p>

    <div class="appointment-card">
      <div class="appointment-title">${data.title}</div>
      <div class="appointment-detail">
        <span class="appointment-detail-icon">📅</span>
        <span class="appointment-detail-text"><strong>${formatDateTime(data.startDateTime)}</strong></span>
      </div>
      <div class="appointment-detail">
        <span class="appointment-detail-icon">⏱️</span>
        <span class="appointment-detail-text">${data.duration} minutes (${formatTime(data.startDateTime)} - ${formatTime(data.endDateTime)})</span>
      </div>
      ${data.location ? `
      <div class="appointment-detail">
        <span class="appointment-detail-icon">📍</span>
        <span class="appointment-detail-text">${data.location}</span>
      </div>
      ` : ""}
      ${data.meetingUrl ? `
      <div class="appointment-detail">
        <span class="appointment-detail-icon">🔗</span>
        <span class="appointment-detail-text"><a href="${data.meetingUrl}" style="color: #667eea;">Join Meeting</a></span>
      </div>
      ` : ""}
      ${data.description ? `
      <div class="appointment-description">
        <strong>Description:</strong><br>
        ${data.description}
      </div>
      ` : ""}
    </div>

    <div class="appointment-buttons">
      <a href="${appUrl}/dashboard" class="appointment-button">View Updated Appointment</a>
    </div>

    <div class="warning">
      <p><strong>Note:</strong> If you didn't request this change, please contact the organizer immediately.</p>
    </div>
  `;

  return createEmailTemplate(
    "Appointment Rescheduled",
    "🔄",
    content,
    `Appointment Rescheduled: ${data.title} on ${formatDate(data.startDateTime)}`,
    `This email was sent to ${data.email}`,
  );
}

// Appointment Cancelled Email
export function generateAppointmentCancelledEmail(data: AppointmentEmailData & { cancelReason?: string }) {
  const appUrl = getAppUrl();
  const appName = getAppName();

  const content = `
    <h2>Appointment Cancelled ❌</h2>
    <p>Hi ${data.name},</p>
    <p>Your appointment has been cancelled. Here are the details:</p>

    <div class="appointment-card">
      <div class="appointment-title">${data.title}</div>
      <div class="appointment-detail">
        <span class="appointment-detail-icon">📅</span>
        <span class="appointment-detail-text">${formatDateTime(data.startDateTime)}</span>
      </div>
      <div class="appointment-detail">
        <span class="appointment-detail-icon">⏱️</span>
        <span class="appointment-detail-text">${data.duration} minutes</span>
      </div>
      ${data.location ? `
      <div class="appointment-detail">
        <span class="appointment-detail-icon">📍</span>
        <span class="appointment-detail-text">${data.location}</span>
      </div>
      ` : ""}
    </div>

    ${data.cancelReason ? `
    <div class="warning" style="background: #fef2f2; border-color: #ef4444;">
      <p style="color: #991b1b;"><strong>Cancellation Reason:</strong> ${data.cancelReason}</p>
    </div>
    ` : ""}

    <div class="appointment-buttons">
      <a href="${appUrl}/dashboard" class="appointment-button">Book New Appointment</a>
    </div>

    <p style="color: #64748b; font-size: 14px;">
      If you believe this was a mistake or you'd like to reschedule, please visit your dashboard.
    </p>
  `;

  return createEmailTemplate(
    "Appointment Cancelled",
    "❌",
    content,
    `Appointment Cancelled: ${data.title}`,
    `This email was sent to ${data.email}`,
  );
}

// Export all appointment templates as an object
export const appointmentEmailTemplates = {
  confirmation: generateAppointmentConfirmationEmail,
  reminder: generateAppointmentReminderEmail,
  rescheduled: generateAppointmentRescheduledEmail,
  cancelled: generateAppointmentCancelledEmail,
};
