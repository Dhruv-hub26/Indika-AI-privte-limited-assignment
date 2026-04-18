import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function adminEmailMatch(email) {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  return adminEmail && email.toLowerCase() === adminEmail;
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const role = adminEmailMatch(email) ? "admin" : "user";
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
    });
    const token = signToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Registration failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Login failed" });
  }
}

export async function me(req, res) {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
