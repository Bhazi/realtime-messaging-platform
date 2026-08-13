import { Router } from "express";
import { AuthController } from "./auth.controller.js";

const router = Router();

export default router.post("/signup", AuthController.signup);
