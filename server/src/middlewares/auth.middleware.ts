import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { TokenService } from "../modules/auth/token.services.js";

const ACCESS_COOKIE_NAME = "access_token";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const accessToken = req.cookies?.[ACCESS_COOKIE_NAME];

  if (!accessToken) {
    res.status(401).json({
      message: "Authentication required.",
    });
    return;
  }

  try {
    const decoded = TokenService.verifyAccessToken(accessToken);

    req.auth = {
      userId: decoded.sub,
      publicUid: decoded.publicUid,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        message: "Access token expired.",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Invalid access token.",
      });
      return;
    }

    res.status(401).json({
      message: "Authentication failed.",
    });
  }
}
