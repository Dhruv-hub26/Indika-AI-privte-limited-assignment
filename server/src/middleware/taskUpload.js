import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, "../../uploads");

function taskDir(taskId) {
  const dir = path.join(uploadsRoot, "tasks", taskId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function pdfOnly(_req, file, cb) {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF files are allowed"));
  }
  cb(null, true);
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    cb(null, taskDir(req.params.id));
  },
  filename(_req, file, cb) {
    const safe = `${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`;
    cb(null, safe);
  },
});

export const uploadTaskPdfs = multer({
  storage,
  fileFilter: pdfOnly,
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
});

export const uploadCreateTaskPdfs = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfOnly,
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
});
