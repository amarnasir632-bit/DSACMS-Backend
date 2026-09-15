import pg from "pg";

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured");
    }

    const databaseUrl = new URL(process.env.DATABASE_URL);
    databaseUrl.searchParams.delete("pgbouncer");
    databaseUrl.searchParams.delete("sslmode");

    pool = new Pool({
      connectionString: databaseUrl.toString(),
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}
