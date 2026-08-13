// import { Pool } from "pg";

// const pool = new Pool({
//   host: process.env.DB_HOST || "localhost",
//   port: Number(process.env.DB_PORT) || 5432,
//   user: process.env.DB_USER || "dev_user",
//   password: process.env.DB_PASSWORD || "dev_password",
//   database: process.env.DB_NAME || "messenger_db",
// });

// export default pool;

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

console.log(
  process.env.DB_HOST,
  Number(process.env.DB_PORT),
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  process.env.DB_NAME,
);

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "dev_user",
  password: process.env.DB_PASSWORD || "dev_password",
  database: process.env.DB_NAME || "messenger_db",
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();

    console.log("✅ PostgreSQL connected");

    client.release();
  } catch (error) {
    console.error("❌ PostgreSQL connection failed");
    console.error(error.message);
  }
};
