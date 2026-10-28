import { z } from "zod";

export const createDirectConversationBodySchema = z.object({
  uid: z
    .string()
    .regex(/^[A-Za-z0-9]{9}$/, "Target UID must be 9 alphanumeric characters."),
});

export const createGroupConversationBodySchema = z.object({
  groupName: z
    .string()
    .trim()
    .min(1, "Group name is required.")
    .max(100, "Group name cannot exceed 100 characters."),

  addedUids: z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value || !value.trim()) {
        return [];
      }

      try {
        return JSON.parse(value);
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Invalid addedUids JSON format.",
        });

        return z.NEVER;
      }
    })
    .pipe(z.array(z.string().trim().min(1, "Member ID cannot be empty.")))
    .default([]),
});

export const deleteMessageParamsSchema = z.object({
  messageId: z.uuid("Invalid message ID."),
});

export const getMessagesParamsSchema = z.object({
  conversationId: z.uuid("Invalid conversation Id."),
});

export const getMessagesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int("Limit must be an integer.")
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit cannot exceed 100.")
    .default(50),

  cursor: z.string().optional(),
});

export const messageCursorSchema = z
  .object({
    createdAt: z.string().datetime(),
    id: z.uuid(),
  })
  .strict();

export const sendMessageParamsSchema = z.object({
  conversationId: z.uuid("Invalid conversatiodId."),
});

export const sendMessageBodySchema = z
  .object({
    type: z.enum(["TEXT", "PHOTO", "VIDEO", "FILE"]),
    content: z.string().trim().max(5000).optional(),
  })
  .optional();
