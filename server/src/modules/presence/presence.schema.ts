import { z } from "zod";

export const isParticipantOnlineParamSchema = z.object({
  targetId: z.uuid("Invalid targetId."),
});

export const onlineParticipantsIdsBodySchema = z.object({
  userIds: z
    .array(z.uuid("Each userId must be a valid UUID."))
    .min(1, "At least one userId is required.")
    .max(100, "A maximum of 100 userIds is allowed."),
});
