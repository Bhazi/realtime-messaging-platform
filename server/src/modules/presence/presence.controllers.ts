import { Request, Response } from "express";

import { PresenceService } from "./presence.services.js";

export class PresenceController {
  static async isParticipantOnline(req: Request, res: Response) {
    try {
      const { targetId } = req.params as { targetId: string };

      const result = await PresenceService.isParticipantOnline(targetId);

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      console.error("Failed to check participant presence:", error);

      return res.status(500).json({
        error: "Failed to fetch participant presence.",
      });
    }
  }

  static async onlineParticipantsIds(req: Request, res: Response) {
    try {
      const { userIds } = req.body;

      const participantsIds =
        await PresenceService.onlineParticipantsIds(userIds);

      return res.status(200).json({
        participantsIds,
      });
    } catch (error) {
      console.error("Failed to count online participants:", error);

      return res.status(500).json({
        error: "Failed to fetch participant presence.",
      });
    }
  }
}
