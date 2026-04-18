import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Task } from "../models/Task.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, "../../uploads");

function canAccessTask(user, task) {
  if (user.role === "admin") return true;
  return task.owner.toString() === user.id;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safePdfFilename() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`;
}

export async function listTasks(req, res) {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (req.user.role !== "admin") {
      filter.owner = req.user.id;
    }
    const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: -1 }).populate("owner", "name email");
    return res.json(tasks);
  } catch (e) {
    return res.status(500).json({ message: e.message || "Failed to list tasks" });
  }
}

export async function getTask(req, res) {
  try {
    const task = await Task.findById(req.params.id).populate("owner", "name email");
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: e.message || "Failed to get task" });
  }
}

export async function createTask(req, res) {
  const uploaded = req.files || [];
  try {
    const { title, description, status, priority, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (uploaded.length > 3) {
      return res.status(400).json({ message: "You can upload at most 3 PDF files" });
    }

    const task = await Task.create({
      title,
      description: description ?? "",
      status: status || "todo",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      owner: req.user.id,
    });

    if (uploaded.length) {
      const dir = path.join(uploadsRoot, "tasks", task._id.toString());
      ensureDir(dir);

      for (const f of uploaded) {
        const filename = safePdfFilename();
        const outPath = path.join(dir, filename);
        fs.writeFileSync(outPath, f.buffer);
        task.attachments.push({
          filename,
          originalName: f.originalname,
          path: outPath,
          mimeType: f.mimetype,
          size: f.size,
        });
      }
      await task.save();
    }

    const populated = await Task.findById(task._id).populate("owner", "name email");
    return res.status(201).json(populated);
  } catch (e) {
    return res.status(500).json({ message: e.message || "Failed to create task" });
  }
}

export async function updateTask(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { title, description, status, priority, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    await task.save();
    const populated = await Task.findById(task._id).populate("owner", "name email");
    return res.json(populated);
  } catch (e) {
    return res.status(500).json({ message: e.message || "Failed to update task" });
  }
}

export async function deleteTask(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const dir = path.join(uploadsRoot, "tasks", task._id.toString());
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    await task.deleteOne();
    return res.json({ message: "Task deleted" });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Failed to delete task" });
  }
}

function unlinkSafe(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

export async function addAttachments(req, res) {
  const uploaded = req.files || [];
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      uploaded.forEach((f) => unlinkSafe(f.path));
      return res.status(404).json({ message: "Task not found" });
    }
    if (!canAccessTask(req.user, task)) {
      uploaded.forEach((f) => unlinkSafe(f.path));
      return res.status(403).json({ message: "Forbidden" });
    }

    const currentCount = task.attachments.length;
    const incomingCount = uploaded.length;
    const maxPerTask = 3;

    if (incomingCount === 0) {
      return res.status(400).json({ message: "No PDF files uploaded" });
    }

    if (currentCount + incomingCount > maxPerTask) {
      uploaded.forEach((f) => unlinkSafe(f.path));
      return res.status(400).json({
        message: `Each task allows at most ${maxPerTask} PDF attachments. This task has ${currentCount}; adding ${incomingCount} would exceed the limit.`,
      });
    }

    for (const file of uploaded) {
      task.attachments.push({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimeType: file.mimetype,
        size: file.size,
      });
    }
    await task.save();
    const populated = await Task.findById(task._id).populate("owner", "name email");
    return res.status(201).json(populated);
  } catch (e) {
    uploaded.forEach((f) => unlinkSafe(f.path));
    return res.status(500).json({ message: e.message || "Upload failed" });
  }
}

export async function deleteAttachment(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const filename = req.params.filename;
    const idx = task.attachments.findIndex((a) => a.filename === filename);
    if (idx === -1) return res.status(404).json({ message: "Attachment not found" });
    const [removed] = task.attachments.splice(idx, 1);
    await task.save();
    unlinkSafe(removed.path);
    const populated = await Task.findById(task._id).populate("owner", "name email");
    return res.json(populated);
  } catch (e) {
    return res.status(500).json({ message: e.message || "Failed to remove attachment" });
  }
}

export async function downloadAttachment(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const filename = req.params.filename;
    const att = task.attachments.find((a) => a.filename === filename);
    if (!att) return res.status(404).json({ message: "Attachment not found" });
    if (!fs.existsSync(att.path)) {
      return res.status(404).json({ message: "File missing on disk" });
    }
    return res.download(att.path, att.originalName);
  } catch (e) {
    return res.status(500).json({ message: e.message || "Download failed" });
  }
}
