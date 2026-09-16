import crypto from "node:crypto";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function secret() {
  return process.env.AUTH_SECRET || process.env.SESSION_SECRET || "dsacms-development-secret";
}

export function createSessionToken(user) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    sub: String(user.id),
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  }));
  const input = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", secret()).update(input).digest("base64url");
  return `${input}.${signature}`;
}

function verifySessionToken(token) {
  const [header, payload, signature] = String(token || "").split(".");
  if (!header || !payload || !signature) return null;
  const input = `${header}.${payload}`;
  const expected = crypto.createHmac("sha256", secret()).update(input).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch (_) {
    return null;
  }
  if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
  return data;
}

export function requireAuth(req, res, next) {
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  const user = verifySessionToken(match && match[1]);
  if (!user) {
    res.status(401).json({ error: "authentication is required" });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Access denied." });
      return;
    }
    next();
  };
}
