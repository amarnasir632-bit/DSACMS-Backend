const MAX_ATTEMPTS = 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function putWithBackoff(url, body, headers) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, { method: "PUT", headers, body });
    if (response.ok) return;
    const detail = await response.text();
    if (response.status < 500 && response.status !== 429) {
      throw new Error(`Internet Archive rejected upload (${response.status}): ${detail.slice(0, 240)}`);
    }
    if (attempt === MAX_ATTEMPTS) {
      throw new Error(`Internet Archive upload failed after retries (${response.status}): ${detail.slice(0, 240)}`);
    }
    const backoff = Math.min(30_000, 1_000 * 2 ** (attempt - 1));
    await sleep(Math.round(backoff * (0.75 + Math.random() * 0.5)));
  }
}

async function archiveMessage(message, env) {
  const { key, contentType, materialId } = message;
  if (!key || !contentType || !materialId) throw new Error("Invalid archive queue message");
  const object = await env.MEDIA_BUCKET.get(key);
  if (!object) throw new Error(`R2 object not found: ${key}`);

  const archiveKey = `${env.ARCHIVE_BUCKET_PREFIX || "dsacms"}/${key}`;
  const archiveUrl = `${env.ARCHIVE_ENDPOINT}/${encodeURIComponent(env.IA_BUCKET)}/${archiveKey
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  await putWithBackoff(archiveUrl, object.body, {
    Authorization: `LOW ${env.IA_ACCESS_KEY}:${env.IA_SECRET_KEY}`,
    "Content-Type": contentType,
    "x-amz-auto-make-bucket": "1",
  });

  await fetch(`${env.API_ORIGIN}/api/internal/archive-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.INTERNAL_CALLBACK_TOKEN}`,
    },
    body: JSON.stringify({ materialId, status: "ARCHIVED", archiveUrl }),
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/enqueue") {
      return new Response("Not found", { status: 404 });
    }
    if (request.headers.get("Authorization") !== `Bearer ${env.PRODUCER_TOKEN}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    await env.ARCHIVE_QUEUE.send(await request.json());
    return Response.json({ queued: true }, { status: 202 });
  },
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        await archiveMessage(message.body, env);
        message.ack();
      } catch (error) {
        console.error("Archive job failed", error);
        message.retry();
      }
    }
  },
};
