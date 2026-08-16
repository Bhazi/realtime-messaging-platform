import { Router } from "express";
import { UserController } from "./user.controllers.js";

const router = Router();

router.get("/", UserController.getUsers);

router.post("/profile/update", UserController.updateUserProfile);

router.post("/password/change", UserController.changePassword);

export default router;
