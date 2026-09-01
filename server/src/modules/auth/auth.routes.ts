import { Router } from "express";
import { AuthController } from "./auth.controllers.js";
import { refreshTokenMiddleware } from "../../middlewares/refresh.middleware.js";

const router = Router();

router.post("/signup", AuthController.signup);

router.post("/login", AuthController.login);

router.post("/logout", AuthController.logout);

router.post("/refresh", refreshTokenMiddleware, AuthController.refresh);

export default router;
