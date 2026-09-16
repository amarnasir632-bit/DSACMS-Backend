import { getPool } from "../config/database.js";

const requestsByIp = new Map();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 2;

function checkRateLimit(ip) {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  requestsByIp.set(ip, recent);
  return true;
}

function publicQuestion(row) {
  return {
    id: String(row.id),
    asker_name: row.asker_name || "فاعل خير",
    question_text: row.question_text,
    answer_text: row.answer_text,
    answered_at: row.updated_at,
  };
}

export async function listPublicQuestions(_req, res, next) {
  try {
    const { rows } = await getPool().query(`
      SELECT id, asker_name, question_text, answer_text, updated_at
      FROM questions
      WHERE status = 'ANSWERED'
      ORDER BY updated_at DESC, id DESC
    `);
    res.json(rows.map(publicQuestion));
  } catch (error) {
    next(error);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const { asker_name = "فاعل خير", question_text, website_url = "" } = req.body || {};
    if (String(website_url).trim()) {
      res.status(400).json({ error: "Spam detected." });
      return;
    }
    if (!checkRateLimit(req.ip || req.socket.remoteAddress || "unknown")) {
      res.status(429).json({ error: "تم تجاوز الحد المسموح. حاول بعد خمس دقائق." });
      return;
    }
    const question = String(question_text || "").trim();
    if (!question || question.length > 10000) {
      res.status(400).json({ error: "question_text is required and must be under 10000 characters" });
      return;
    }
    const name = String(asker_name || "").trim().slice(0, 255) || "فاعل خير";
    const { rows } = await getPool().query(
      `INSERT INTO questions (asker_name, question_text)
       VALUES ($1, $2)
       RETURNING id, asker_name, question_text, status, created_at`,
      [name, question]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function listPendingQuestions(_req, res, next) {
  try {
    const { rows } = await getPool().query(
      `SELECT id, asker_name, question_text, answer_text, status, sheikh_id, created_at, updated_at
       FROM questions WHERE status = 'PENDING' ORDER BY created_at ASC, id ASC`
    );
    res.json(rows.map((row) => ({ ...row, id: String(row.id), sheikh_id: row.sheikh_id && String(row.sheikh_id) })));
  } catch (error) {
    next(error);
  }
}

export async function listAnsweredQuestions(_req, res, next) {
  try {
    const { rows } = await getPool().query(
      `SELECT id, asker_name, question_text, answer_text, status, sheikh_id, created_at, updated_at
       FROM questions WHERE status = 'ANSWERED' ORDER BY updated_at DESC, id DESC`
    );
    res.json(rows.map((row) => ({ ...row, id: String(row.id), sheikh_id: row.sheikh_id && String(row.sheikh_id) })));
  } catch (error) {
    next(error);
  }
}

export async function answerQuestion(req, res, next) {
  try {
    const answer = String(req.body?.answer_text || "").trim();
    if (!answer || answer.length > 20000) {
      res.status(400).json({ error: "answer_text is required and must be under 20000 characters" });
      return;
    }
    const { rows } = await getPool().query(
      `UPDATE questions
       SET answer_text = $1, sheikh_id = $2, status = 'ANSWERED', updated_at = NOW()
       WHERE id = $3 AND status = 'PENDING'
       RETURNING id, asker_name, question_text, answer_text, status, sheikh_id, created_at, updated_at`,
      [answer, req.user.sub, req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: "pending question not found" });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function editAnswer(req, res, next) {
  try {
    const answer = String(req.body?.answer_text || "").trim();
    if (!answer || answer.length > 20000) {
      res.status(400).json({ error: "answer_text is required and must be under 20000 characters" });
      return;
    }
    const { rows } = await getPool().query(
      `UPDATE questions
       SET answer_text = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'ANSWERED'
       RETURNING id, asker_name, question_text, answer_text, status, sheikh_id, created_at, updated_at`,
      [answer, req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: "answered question not found" });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function rejectQuestion(req, res, next) {
  try {
    const { rows } = await getPool().query(
      `UPDATE questions SET status = 'REJECTED', updated_at = NOW()
       WHERE id = $1 AND status = 'PENDING'
       RETURNING id, status, updated_at`,
      [req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: "pending question not found" });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}
