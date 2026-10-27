import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

import {
  isParticipantOnlineParamSchema,
  onlineParticipantsIdsBodySchema,
} from "./presence.schema.js";

import { PresenceController } from "../presence/presence.controllers.js";
import { validate } from "../../middlewares/validate.js";

const router = Router();

router.get(
  "/:targetId",
  authMiddleware,
  validate(isParticipantOnlineParamSchema, "params"),
  PresenceController.isParticipantOnline,
);

router.post(
  "/participants",
  authMiddleware,
  validate(onlineParticipantsIdsBodySchema),
  PresenceController.onlineParticipantsIds,
);

export default router;
