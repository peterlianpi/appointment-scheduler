import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  crons: [
    {
      path: "/api/cron/reminders",
      schedule: "0 18 * * *", // Run once a day at 6 PM UTC (midnight in Rangoon/Asia)
    },
  ],
};
