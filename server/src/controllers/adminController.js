import { User } from "../models/User.js";
import { Task } from "../models/Task.js";

export async function listUsers(_req, res) {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    return res.json(users);
  } catch (e) {
    return res.status(500).json({ message: e.message || "Failed to list users" });
  }
}

export async function listAllTasks(req, res) {
  try {
    const { status, priority, owner } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (owner) filter.owner = owner;
    const tasks = await Task.find(filter).sort({ updatedAt: -1 }).populate("owner", "name email role");
    return res.json(tasks);
  } catch (e) {
    return res.status(500).json({ message: e.message || "Failed to list tasks" });
  }
}
