import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";


const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: false,
  idleTimeout: 10_000,
});

export const database = drizzle(pool);
