import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

import { connectDB } from "./config/db.js";
// Serve uploaded static avatar images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRoutes);
// Mount API routes matching /api/v1/profile
app.use("/api/v1/profile", userRoutes);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Basic Messenger API Health Route
app.get("/api/v1", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "messenger-backend",
    timestamp: new Date().toISOString(),
  });
});

// Express v5 Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`💥 Server Error: ${err.message}`);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, async () => {
  await connectDB();

  console.log(`🚀 Messenger backend streaming on http://localhost:${PORT}`);
});
