import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

export const pubClient = createClient({
  url: process.env.REDIS_URL,
});

pubClient.on("error", (error) => {
  console.error("Redis error :", error);
});

export const subClient = pubClient.duplicate();

subClient.on("error", (error) => {
  console.error("Redis subscriber error:", error);
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();

    await Promise.all([pubClient.connect(), subClient.connect()]);
  }
}
