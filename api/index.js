import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5500")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/status", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "dsacms-api",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;

if (process.env.NODE_ENV !== "production") {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`DSACMS API listening on http://localhost:${port}`);
  });
}
