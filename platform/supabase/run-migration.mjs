// Applies a SQL migration file to the Supabase Postgres DB.
// Usage: node run-migration.mjs <path-to-sql>
// Requires `pg` and env SUPABASE_DB_URL (or DB_URL).
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node run-migration.mjs <path-to-sql>");
  process.exit(1);
}

const connectionString =
  process.env.SUPABASE_DB_URL || process.env.DB_URL;
if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL env var");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`[ok] applied migration: ${file}`);
} catch (err) {
  console.error(`[fail] ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
