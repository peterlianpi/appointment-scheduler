import { Hono } from "hono";
import { handle } from "hono/vercel";

import appointment from "./appointment";
import notifications from "./notifications";

const app = new Hono().basePath("/api");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = app
  .route("/appointment", appointment)
  .route("/notifications", notifications);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
export const OPTIONS = handle(app);

export type AppType = typeof route;
