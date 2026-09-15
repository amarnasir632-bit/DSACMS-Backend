import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.IA_ENDPOINT || "https://s3.us.archive.org";

export const archiveStorage = new S3Client({
  endpoint,
  region: process.env.IA_REGION || "us-east-1",
  credentials: {
    // إضافة trim() لحذف أي مسافات منسوجة بالخطأ من Vercel
    accessKeyId: (process.env.IA_ACCESS_KEY || "").trim(),
    secretAccessKey: (process.env.IA_SECRET_KEY || "").trim(),
  },
  forcePathStyle: true,
});

function requireStorageConfig() {
  const required = ["IA_ACCESS_KEY", "IA_SECRET_KEY", "IA_BUCKET"];
  const missing = required.filter((name) => !process.env[name] || process.env[name].trim() === "");
  if (missing.length > 0) {
    throw new Error(`Internet Archive storage is not configured: ${missing.join(", ")}`);
  }
}

export async function createUploadUrl({ key, contentType, expiresIn = 900 }) {
  if (!key || !contentType) {
    throw new TypeError("key and contentType are required");
  }

  requireStorageConfig();

  const command = new PutObjectCommand({
    Bucket: process.env.IA_BUCKET.trim(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(archiveStorage, command, { expiresIn });
}

export function archiveObjectUrl(key) {
  if (!key) {
    throw new TypeError("key is required");
  }
  requireStorageConfig();
  return `${endpoint}/${encodeURIComponent(process.env.IA_BUCKET.trim())}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export async function uploadArchiveFile({ key, contentType, body }) {
  if (!key || !contentType || !body) {
    throw new TypeError("key, contentType and body are required");
  }
  requireStorageConfig();
  const response = await fetch(`${endpoint}/${encodeURIComponent(process.env.IA_BUCKET.trim())}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`, {
    method: "PUT",
    headers: {
      Authorization: `LOW ${process.env.IA_ACCESS_KEY}:${process.env.IA_SECRET_KEY}`,
      "Content-Type": contentType,
      "x-amz-auto-make-bucket": "1",
    },
    body,
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Internet Archive upload failed (${response.status}): ${detail.slice(0, 240)}`);
    error.statusCode = response.status;
    throw error;
  }
}
