import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.IA_ENDPOINT || "https://s3.us.archive.org";

export const archiveStorage = new S3Client({
  endpoint,
  region: process.env.IA_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.IA_ACCESS_KEY || "",
    secretAccessKey: process.env.IA_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

function requireStorageConfig() {
  const required = ["IA_ACCESS_KEY", "IA_SECRET_KEY", "IA_BUCKET"];
  const missing = required.filter((name) => !process.env[name]);
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
    Bucket: process.env.IA_BUCKET,
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
  return `${endpoint}/${encodeURIComponent(process.env.IA_BUCKET)}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
