import { z } from "zod";

export const addUserToGroupBodySchema = z
  .object({
    conversationId: z.uuid({
      error: "Invalid conversation ID.",
    }),

    targetUid: z
      .string()
      .regex(
        /^[A-Za-z0-9]{9}$/,
        "Target UID must be 9 alphanumeric characters.",
      ),
  })
  .strict();

export const changePasswordBodySchema = z.object({
  oldPassword: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(128, "Password must not exceed 128 characters."),

  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(128, "Password must not exceed 128 characters."),
});

export const conversationIdParamsSchema = z.object({
  conversationId: z.uuid(),
});

export const getUserByIdParamsSchema = z.object({
  id: z.uuid(),
});

export const getUserByUidParamsSchema = z.object({
  uid: z
    .string()
    .regex(/^[A-Za-z0-9]{9}$/, "Target UID must be 9 alphanumeric characters."),
});

export const removeUserFromGroupParamsSchema = z.object({
  conversationId: z.uuid(),
  targetUserId: z.uuid(),
});

export const updateGroupMemberRoleParamsSchema = z.object({
  conversationId: z.uuid(),
});

export const updateGroupMemberRoleBodySchema = z.object({
  userId: z.uuid(),
  role: z.enum(["admin", "member"]),
});

export const updateUserProfileBodySchema = z
  .object({
    updates: z
      .object({
        displayName: z
          .string()
          .trim()
          .min(2, "Display name must be at least 2 characters.")
          .max(100, "Display name must not exceed 100 characters.")
          .optional(),

        username: z
          .string()
          .trim()
          .min(3, "Username must be at least 3 characters.")
          .max(30, "Username must not exceed 30 characters.")
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can contain only letters, numbers, and underscores.",
          )
          .transform((value) => value.toLowerCase())
          .optional(),
      })
      .strict()
      .refine(
        (updates) => Object.keys(updates).length > 0,
        "At least one profile field must be provided.",
      ),
  })
  .strict();
