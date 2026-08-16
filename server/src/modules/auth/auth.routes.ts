import { Router } from "express";
import { AuthController } from "./auth.controllers.js";

const router = Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);

export default router;
