import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  crons: [
    {
      path: "/api/cron/reminders",
      schedule: "0 0 * * *", // Run once a day at midnight
    },
  ],
};
