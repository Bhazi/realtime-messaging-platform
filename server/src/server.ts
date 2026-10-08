import "dotenv/config";

import cluster from "node:cluster";
import { createServer } from "node:http";
import os from "node:os";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { initializeSocket } from "./socket.js";

const PORT = Number(process.env.PORT ?? 5000);

async function startWorker(): Promise<void> {
  try {
    await connectDB();
    await connectRedis();

    const httpServer = createServer(app);

    const serverId = String(process.pid);

    initializeSocket(httpServer, serverId);

    httpServer.listen(PORT, () => {
      console.log(`Worker ${process.pid} listening on port ${PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Worker ${process.pid} received ${signal}. Shutting down...`);

      httpServer.close(() => {
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error(`Worker ${process.pid} failed to start:`, error);
    process.exit(1);
  }
}

if (cluster.isPrimary) {
  const workerCount = os.availableParallelism();

  console.log(`Primary ${process.pid} starting ${workerCount} workers`);

  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.error(
      `Worker ${worker.process.pid} exited (code: ${code}, signal: ${signal}). Restarting...`,
    );

    cluster.fork();
  });
} else {
  void startWorker();
}
