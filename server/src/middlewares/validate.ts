import type { RequestHandler } from "express";
import type { z } from "zod";

type ValidationTarget = "body" | "params" | "query";

export function validate(
  schema: z.ZodType,
  target: ValidationTarget = "body",
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      res.status(400).json({
        error: "Validation Failed",
        details: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    if (target === "body") {
      req.body = result.data;
    }

    next();
  };
}
