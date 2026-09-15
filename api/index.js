import "dotenv/config";
import cors from "cors";
import express from "express";
import contentRoutes from "../routes/content.js";
import authRoutes from "../routes/auth.js";

const app = express();
const allowedOrigins = [
  "https://dsacms-frontend.vercel.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  ...(process.env.FRONTEND_ORIGIN || "").split(","),
]
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
app.use("/api", contentRoutes);
app.use("/api/auth", authRoutes);

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
  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    status,
  });
});

export default app;

if (process.env.NODE_ENV !== "production") {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`DSACMS API listening on http://localhost:${port}`);
  });
}
