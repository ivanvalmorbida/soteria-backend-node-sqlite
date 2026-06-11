import { createClient } from "@libsql/client";
import "dotenv/config";

let client;

export function getDb() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error("TURSO_DATABASE_URL não definida");
    }

    client = createClient({
      url,
      ...(authToken ? { authToken } : {}),
    });
  }
  return client;
}

export async function query(sql, args = []) {
  const db = getDb();
  const result = await db.execute({ sql, args });
  return result;
}

export async function queryAll(sql, args = []) {
  const db = getDb();
  const result = await db.execute({ sql, args });
  return result.rows;
}

export async function queryOne(sql, args = []) {
  const db = getDb();
  const result = await db.execute({ sql, args });
  return result.rows[0] || null;
}

export async function execute(sql, args = []) {
  const db = getDb();
  const result = await db.execute({ sql, args });
  return result;
}
