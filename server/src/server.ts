import "dotenv/config";

import cluster from "node:cluster";
import os from "node:os";

const PORT = process.env.PORT || 5000;

async function startWorker() {
  const { createServer } = await import("http");

  const { default: app } = await import("./app.js");

  const { initializeSocket } = await import("./socket.js");

  const { connectDB } = await import("./config/db.js");

  const { connectRedis } = await import("./config/redis.js");

  await connectDB();
  await connectRedis();

  const httpServer = createServer(app);

  const stringPId = String(process.pid);

  initializeSocket(httpServer, stringPId);

  httpServer.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on ${PORT}`);
  });
}

if (cluster.isPrimary) {
  const numWorkers = os.availableParallelism();

  console.log(`Primary ${process.pid} starting ${numWorkers} workers`);

  for (let i = 0; i < 1; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);

    cluster.fork();
  });
} else {
  startWorker();
}
