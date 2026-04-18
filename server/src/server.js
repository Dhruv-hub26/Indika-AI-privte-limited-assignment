import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, "../uploads");

const app = express();
const PORT = Number(process.env.PORT) || 5001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

fs.mkdirSync(uploadsRoot, { recursive: true });

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  if (err?.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }
  if (err?.message === "Only PDF files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: err.message || "Server error" });
});

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
