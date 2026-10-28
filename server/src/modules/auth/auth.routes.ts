import { Router } from "express";

import { AuthController } from "./auth.controllers.js";

import { refreshTokenMiddleware } from "../../middlewares/refresh.middleware.js";
import { validate } from "../../middlewares/validate.js";

import { signupSchema, loginSchema } from "./auth.schema.js";

const router = Router();

router.post("/login", validate(loginSchema), AuthController.login);

router.post("/logout", AuthController.logout);

router.post("/refresh", refreshTokenMiddleware, AuthController.refresh);

router.post("/signup", validate(signupSchema), AuthController.signup);

export default router;
