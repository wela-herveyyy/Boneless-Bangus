import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Survive Turbopack HMR — otherwise each reload leaks a new pool → ER_CON_COUNT_ERROR
const globalForDb = globalThis as unknown as { __bbaiMysqlPool?: mysql.Pool };

const pool =
  globalForDb.__bbaiMysqlPool ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 10_000,
    queueLimit: 0,
    enableKeepAlive: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__bbaiMysqlPool = pool;
}

export const database = drizzle(pool, { schema, mode: "default" });
