# DSACMS Backend API

Standalone Serverless REST API for the DSACMS scientific and audio content
management system. It uses Node.js and Express, is optimized for Vercel
Serverless Functions, stores relational metadata in PostgreSQL, and integrates
with the Internet Archive S3-compatible API for large audio and PDF files.

## Overview

The API is intentionally independent from the frontend and can be deployed from
this repository as its own Vercel project. The current foundation provides:

- A Vercel-compatible Express entry point.
- `GET /api/status` for deployment and uptime checks.
- `GET /api/categories` for published category metadata.
- `GET /api/materials` for published materials joined with category names.
- `POST /api/materials` for creating material records and optionally requesting
  an Internet Archive signed upload URL.
- A PostgreSQL schema for categories, materials, and users.
- A lazy PostgreSQL connection pool for serverless reuse.
- Internet Archive S3-compatible signed upload URL utilities.
- CORS configuration for one or more frontend origins.

## Folder structure

```text
.
├── api/
│   └── index.js
├── config/
│   └── database.js
├── database/
│   └── schema.sql
├── utils/
│   └── storage.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── vercel.json
```

## Requirements

- Node.js 20 or later.
- A PostgreSQL database.
- Internet Archive S3 credentials and an Internet Archive item/bucket.
- Vercel CLI for local Serverless emulation and deployment.

## Environment variables

Create a local `.env` file from `.env.example`. Never commit `.env` or real
credentials.

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | Runtime environment; use `production` on Vercel. |
| `PORT` | No | Local Express port; defaults to `3000`. |
| `FRONTEND_ORIGIN` | Yes | Allowed frontend origin(s), comma-separated for multiple environments. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `IA_ACCESS_KEY` | Yes | Internet Archive S3 access key. |
| `IA_SECRET_KEY` | Yes | Internet Archive S3 secret key. |
| `IA_BUCKET` | Yes | Internet Archive item/bucket identifier. |
| `IA_REGION` | No | S3 signing region; defaults to `us-east-1`. |
| `IA_ENDPOINT` | No | S3 endpoint; defaults to `https://s3.us.archive.org`. |

Example:

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:5500
DATABASE_URL=postgresql://user:password@localhost:5432/dsacms
IA_ACCESS_KEY=your-internet-archive-access-key
IA_SECRET_KEY=your-internet-archive-secret-key
IA_BUCKET=your-archive-item
IA_REGION=us-east-1
IA_ENDPOINT=https://s3.us.archive.org
```

## Database setup

Apply the schema to the target PostgreSQL database before using material
endpoints:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

The schema creates:

- `categories`: content classifications.
- `materials`: titles, descriptions, category relationships, and audio/PDF URLs.
- `users`: usernames, password hashes, and roles.

## Local development

```bash
npm install
cp .env.example .env
npm run check
npm run dev
```

The health endpoint is available at:

```text
http://localhost:3000/api/status
```

The API does not buffer large media files. The `createUploadUrl` utility
generates a short-lived signed PUT URL so the frontend can upload audio or PDF
content directly to Internet Archive.

## API examples

Fetch categories and materials:

```bash
curl https://YOUR_PROJECT.vercel.app/api/categories
curl https://YOUR_PROJECT.vercel.app/api/materials
```

Create an article:

```bash
curl -X POST https://YOUR_PROJECT.vercel.app/api/materials \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "عنوان المقال",
    "description": "وصف مختصر",
    "contentType": "article",
    "body": ["الفقرة الأولى"],
    "keywords": ["علم"],
    "categoryId": 1
  }'
```

For an audio or PDF upload, include an `upload` object with `key` and
`contentType`. The response contains a short-lived `uploadUrl`; upload the
binary directly to that URL, then persist the returned material URL in the
client workflow.

## Vercel deployment

1. Import this repository into Vercel.
2. Keep the project root at the repository root.
3. Configure the environment variables above in the Vercel project settings.
4. Apply `database/schema.sql` to PostgreSQL.
5. Deploy with the Vercel dashboard or CLI:

   ```bash
   npx vercel --prod
   ```

The `vercel.json` file maps `/api/*` requests to `api/index.js`. After
deployment, verify:

```bash
curl https://YOUR_PROJECT.vercel.app/api/status
```
