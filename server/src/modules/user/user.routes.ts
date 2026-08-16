import { Router } from "express";
import { UserController } from "./user.controllers.js";
import { uploadAvatar } from "../../middlewares/uploads.js";

const router = Router();

router.get("/", UserController.getUsers);

// GET user by primary key ID: /api/v1/user/id/123e4567-e89b-12d3-a456-426614174000
router.get("/id/:id", UserController.getUserById);

// GET user by public UID: /api/v1/user/uid/8KX4P92M
router.get("/uid/:uid", UserController.getUserByUid);

router.post("/profile/update", UserController.updateUserProfile);

router.post("/password/change", UserController.changePassword);

router.post(
  "/avatar",
  uploadAvatar.single("avatar"), // Expects formData field name to be 'avatar'
  UserController.updateAvatar,
);

export default router;
