import crypto from "node:crypto";
import { getPool } from "../config/database.js";

const DEFAULT_ACCOUNTS = [
  ["admin", "مدير النظام", "admin", "Admin1234"],
  ["manager", "مدير المحتوى", "manager", "Manager1234"],
  ["amarnasir632@gmail.com", "مدير الموقع", "admin", "admin1234"],
];

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

async function ensureDefaultAccounts() {
  const pool = getPool();
  for (const [username, _name, role, password] of DEFAULT_ACCOUNTS) {
    await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      [username, hashPassword(password), role]
    );
  }
}

export async function listUsers(_req, res, next) {
  try {
    await ensureDefaultAccounts();
    const { rows } = await getPool().query(
      "SELECT id, username, role, created_at FROM users ORDER BY created_at ASC, id ASC"
    );
    res.json(rows.map((user) => ({
      ...user,
      id: String(user.id),
      name: user.username === "admin"
        ? "مدير النظام"
        : user.username === "manager"
          ? "مدير المحتوى"
          : user.username === "amarnasir632@gmail.com"
            ? "مدير الموقع"
            : user.username,
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

    await ensureDefaultAccounts();
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
        name: user.username === "admin" ? "مدير النظام" : user.username === "manager" ? "مدير المحتوى" : "مدير الموقع",
        role: user.role,
        status: "active",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const { username, password, role = "viewer" } = req.body || {};
    if (!username || !password || !["admin", "manager", "viewer"].includes(role)) {
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
