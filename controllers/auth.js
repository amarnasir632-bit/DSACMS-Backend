import crypto from "node:crypto";
import { getPool } from "../config/database.js";
import { createSessionToken } from "../middleware/auth.js";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || "").split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function displayName(username, role) {
  if (role === "SHEIKH") return "الشيخ";
  if (username === "admin") return "مدير النظام";
  if (username === "manager") return "مدير المحتوى";
  if (username === "amarnasir632@gmail.com") return "مدير الموقع";
  return username;
}

export async function listUsers(_req, res, next) {
  try {
    const { rows } = await getPool().query(
      "SELECT id, username, role, created_at FROM users ORDER BY created_at ASC, id ASC"
    );
    res.json(rows.map((user) => ({
      ...user,
      id: String(user.id),
      name: displayName(user.username, user.role),
      status: "active",
    })));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ error: "username and password are required" });
      return;
    }

    const { rows } = await getPool().query(
      "SELECT id, username, password_hash, role FROM users WHERE lower(username) = lower($1) LIMIT 1",
      [String(username).trim()]
    );
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      return;
    }
    res.json({
      user: {
        id: String(user.id),
        username: user.username,
        name: displayName(user.username, user.role),
        role: user.role,
        status: "active",
      },
      token: createSessionToken(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    if (!/^\d+$/.test(String(req.params.id))) {
      res.status(400).json({ error: "a numeric user id is required" });
      return;
    }
    const { rowCount } = await getPool().query(
      "DELETE FROM users WHERE id = $1",
      [req.params.id]
    );
    if (!rowCount) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const { username, password, role = "viewer" } = req.body || {};
    if (!username || !password || !["admin", "manager", "viewer", "SHEIKH"].includes(role)) {
      res.status(400).json({ error: "username, password and a valid role are required" });
      return;
    }
    const { rows } = await getPool().query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role, created_at`,
      [String(username).trim().toLowerCase(), hashPassword(password), role]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    if (!/^\d+$/.test(String(req.params.id))) {
      res.status(400).json({ error: "a numeric user id is required" });
      return;
    }

    const { password, role } = req.body || {};
    const validRoles = ["admin", "manager", "viewer", "SHEIKH"];
    if (password === undefined && role === undefined) {
      res.status(400).json({ error: "password or role is required" });
      return;
    }
    if (password !== undefined && (!String(password) || String(password).length > 200)) {
      res.status(400).json({ error: "password must be between 1 and 200 characters" });
      return;
    }
    if (role !== undefined && !validRoles.includes(role)) {
      res.status(400).json({ error: "a valid role is required" });
      return;
    }

    const updates = [];
    const values = [];
    if (password !== undefined) {
      values.push(hashPassword(String(password)));
      updates.push(`password_hash = $${values.length}`);
    }
    if (role !== undefined) {
      values.push(role);
      updates.push(`role = $${values.length}`);
    }
    values.push(req.params.id);

    const { rows } = await getPool().query(
      `UPDATE users SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING id, username, role, created_at`,
      values
    );
    if (!rows[0]) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}
