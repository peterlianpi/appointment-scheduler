import { Hono } from "hono";

const app = new Hono()

  .get("/", (c) => c.json({ ok: true }, 200))
  .post("/")
  .patch("/")
  .delete("/");

export default app;
