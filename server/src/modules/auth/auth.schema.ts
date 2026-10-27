import { z } from "zod";

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be atleast 3 characters")
    .max(30, "Username must be maximum 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username contains only numbers, letters and underscores",
    )
    .transform((value) => value.toLowerCase()),

  email: z
    .email({ error: "Please provide a valid email address." })
    .trim()
    .max(254, "Email must not exceed 254 characters.")
    .transform((value) => value.toLowerCase()),

  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(100, "Display name must not exceed 100 characters."),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(128, "Password must not exceed 128 characters."),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Username or email is required.")
    .max(254, "Identifier must not exceed 254 characters.")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password must not exceed 128 characters."),
});
