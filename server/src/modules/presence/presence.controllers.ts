import { Request, Response } from "express";

import { PresenceService } from "./presence.services.js";

export class PresenceController {
  static async isParticipantOnline(req: Request, res: Response) {
    const { targetId } = req.params as { targetId: string };

    if (!targetId) {
      res.status(400).json({
        message: "targetId is required.",
      });
      return;
    }

    const result = await PresenceService.isParticipantOnline(targetId);

    res.status(200).json({
      data: result,
    });
  }

  static async onlineParticipantsIds(req: Request, res: Response) {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds)) {
        return res.status(400).json({
          error: "userIds must be an array.",
        });
      }

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
