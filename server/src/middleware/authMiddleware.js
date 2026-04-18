import jwt from "jsonwebtoken";

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export function protect(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }
  try {
    const decoded = jwt.verify(token, getSecret());
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized" });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
