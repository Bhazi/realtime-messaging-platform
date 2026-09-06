import { Router } from "express";
import { PresenceController } from "../presence/presence.controllers.js";

const router = Router();

router.get("/:targetId", PresenceController.isParticipantOnline);
router.post("/participants", PresenceController.onlineParticipantsIds);

export default router;
