import { getPool } from "../config/database.js";
import { archiveObjectUrl, createUploadUrl } from "../utils/storage.js";

export async function listCategories(_req, res, next) {
  try {
    const { rows } = await getPool().query(
      "SELECT id, name, description, created_at FROM categories ORDER BY name ASC"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function listMaterials(_req, res, next) {
  try {
    const { rows } = await getPool().query(`
      SELECT
        m.id,
        m.title,
        m.description,
        m.author,
        m.category_id,
        c.name AS category_name,
        m.audio_url,
        m.document_url,
        m.content_type,
        m.body,
        m.keywords,
        m.duration_seconds,
        m.status,
        m.created_at
      FROM materials m
      LEFT JOIN categories c ON c.id = m.category_id
      WHERE m.status = 'published'
      ORDER BY m.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createMaterial(req, res, next) {
  try {
    const {
      title,
      description = "",
      author = "",
      categoryId = null,
      audioUrl = null,
      documentUrl = null,
      contentType = "audio",
      body = [],
      keywords = [],
      durationSeconds = 0,
      status = "published",
      upload,
    } = req.body;

    if (!title || !["audio", "article", "book"].includes(contentType)) {
      res.status(400).json({ error: "title and a valid contentType are required" });
      return;
    }

    const client = await getPool().connect();
    try {
      await client.query("BEGIN");

      let resolvedAudioUrl = audioUrl;
      let resolvedDocumentUrl = documentUrl;
      let uploadUrl = null;
      if (upload?.key && upload?.contentType) {
        uploadUrl = await createUploadUrl(upload);
        if (contentType === "book") {
          resolvedDocumentUrl = archiveObjectUrl(upload.key);
        } else {
          resolvedAudioUrl = archiveObjectUrl(upload.key);
        }
      }

      const { rows } = await client.query(
        `INSERT INTO materials
          (title, description, author, category_id, audio_url, document_url,
           content_type, body, keywords, duration_seconds, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11)
         RETURNING *`,
        [
          title,
          description,
          author,
          categoryId,
          resolvedAudioUrl,
          resolvedDocumentUrl,
          contentType,
          JSON.stringify(Array.isArray(body) ? body : []),
          JSON.stringify(Array.isArray(keywords) ? keywords : []),
          Number(durationSeconds) || 0,
          status,
        ]
      );
      await client.query("COMMIT");
      res.status(201).json({ material: rows[0], uploadUrl });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
}
