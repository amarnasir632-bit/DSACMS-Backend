import { getPool } from "../config/database.js";

function normalizeDirectUrl(value, fieldName, { required = false } = {}) {
  if (value == null || String(value).trim() === "") {
    if (required) throw new TypeError(`${fieldName} is required`);
    return null;
  }
  let parsed;
  try { parsed = new URL(String(value).trim()); } catch (_) {
    throw new TypeError(`${fieldName} must be a valid URL`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new TypeError(`${fieldName} must use http or https`);
  }
  return parsed.toString();
}

export async function listCategories(_req, res, next) {
  try {
    const { rows } = await getPool().query("SELECT id, name, description, created_at FROM categories ORDER BY name ASC");
    res.json(rows);
  } catch (error) { next(error); }
}

export async function createCategory(req, res, next) {
  try {
    const { name, description = "" } = req.body || {};
    if (!name || !String(name).trim()) { res.status(400).json({ error: "name is required" }); return; }
    const { rows } = await getPool().query(
      "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at",
      [String(name).trim(), description]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
}

export async function deleteCategory(req, res, next) {
  try {
    const { rowCount } = await getPool().query(
      "DELETE FROM categories WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM materials WHERE category_id = $1)",
      [req.params.id]
    );
    if (!rowCount) { res.status(409).json({ error: "category is missing or still has materials" }); return; }
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function listMaterials(_req, res, next) {
  try {
    const { rows } = await getPool().query(`
      SELECT m.id, m.title, m.description, m.author, m.category_id,
        c.name AS category_name, m.audio_url, m.document_url, m.content_type,
        m.body, m.keywords, m.duration_seconds, m.status, m.archive_status, m.archive_url, m.created_at
      FROM materials m LEFT JOIN categories c ON c.id = m.category_id
      WHERE m.status = 'published' ORDER BY m.created_at DESC
    `);
    res.json(rows);
  } catch (error) { next(error); }
}

export async function archiveStatusHandler(req, res, next) {
  try {
    const expected = process.env.INTERNAL_CALLBACK_TOKEN;
    if (!expected || (req.headers.authorization || "") !== "Bearer " + expected) {
      res.status(401).json({ error: "unauthorized" }); return;
    }
    const { materialId, status, archiveUrl = null } = req.body || {};
    if (!materialId || !["ARCHIVED", "ARCHIVE_FAILED"].includes(status)) {
      res.status(400).json({ error: "materialId and a valid archive status are required" }); return;
    }
    const { rows } = await getPool().query(
      `UPDATE materials SET archive_status = $1, archive_url = $2,
       archive_updated_at = NOW(), archive_last_error = NULL
       WHERE id = $3 RETURNING id`,
      [status, archiveUrl, materialId]
    );
    if (!rows[0]) { res.status(404).json({ error: "material not found" }); return; }
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function createMaterial(req, res, next) {
  try {
    const {
      title, description = "", author = "", categoryId = null,
      audioUrl = null, documentUrl = null, contentType = "audio",
      body = [], keywords = [], durationSeconds = 0, status = "published",
    } = req.body;
    if (!title || !["audio", "article", "book"].includes(contentType)) {
      res.status(400).json({ error: "title and a valid contentType are required" }); return;
    }
    let resolvedAudioUrl;
    let resolvedDocumentUrl;
    try {
      resolvedAudioUrl = normalizeDirectUrl(audioUrl, "audioUrl", { required: contentType === "audio" });
      resolvedDocumentUrl = normalizeDirectUrl(documentUrl, "documentUrl", { required: contentType === "book" });
    } catch (error) {
      res.status(400).json({ error: error.message }); return;
    }
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO materials
          (title, description, author, category_id, audio_url, document_url,
           content_type, body, keywords, duration_seconds, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11)
         RETURNING *`,
        [title, description, author, categoryId, resolvedAudioUrl, resolvedDocumentUrl,
          contentType, JSON.stringify(Array.isArray(body) ? body : []),
          JSON.stringify(Array.isArray(keywords) ? keywords : []), Number(durationSeconds) || 0, status]
      );
      await client.query("COMMIT");
      res.status(201).json({ material: rows[0] });
    } catch (error) {
      await client.query("ROLLBACK"); throw error;
    } finally { client.release(); }
  } catch (error) { next(error); }
}

export async function updateMaterialStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!["published", "draft", "archived"].includes(status)) {
      res.status(400).json({ error: "a valid status is required" }); return;
    }
    const { rows } = await getPool().query(
      "UPDATE materials SET status = $1 WHERE id = $2 RETURNING *", [status, req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: "material not found" }); return; }
    res.json({ material: rows[0] });
  } catch (error) { next(error); }
}

export async function deleteMaterial(req, res, next) {
  try {
    const { rowCount } = await getPool().query("DELETE FROM materials WHERE id = $1", [req.params.id]);
    if (!rowCount) { res.status(404).json({ error: "material not found" }); return; }
    res.status(204).end();
  } catch (error) { next(error); }
}
