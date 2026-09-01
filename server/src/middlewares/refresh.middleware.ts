// src/auth/refresh.middleware.ts

import type { Request, Response, NextFunction } from "express";

import { TokenService } from "../modules/auth/token.services.js";
import { AuthSessionCache } from "../modules/auth/auth.session.cache.js";

const REFRESH_COOKIE_NAME = "refresh_token";

export interface RefreshAuthenticatedRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
    remainingTTL: number;
  };
}

export async function refreshTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    res.status(401).json({
      message: "Refresh token required.",
    });
    return;
  }

  try {
    // 1. Verify JWT
    const decoded = TokenService.verifyRefreshToken(refreshToken);

    // 2. Get session ID from jti
    const sessionId = decoded.jti;

    // 3. Find session in Redis
    const session = await AuthSessionCache.getSession(sessionId);

    if (!session) {
      res.status(401).json({
        message: "Invalid refresh session.",
      });
      return;
    }

    // 4. Check revoked
    if (session.revoked) {
      res.status(401).json({
        message: "Refresh session has been revoked.",
      });
      return;
    }

    // 5. Check expiration
    if (session.expiresAt <= Date.now()) {
      res.status(401).json({
        message: "Refresh session has expired.",
      });
      return;
    }

    // 6. Compare refresh token hash
    const incomingHash = TokenService.hashRefreshToken(refreshToken);

    if (incomingHash !== session.refreshTokenHash) {
      res.status(401).json({
        message: "Invalid refresh token.",
      });
      return;
    }

    const remainingTTL = Math.floor((session.expiresAt - Date.now()) / 1000);

    // Attach validated authentication information
    (req as RefreshAuthenticatedRequest).auth = {
      userId: decoded.sub,
      sessionId,
      remainingTTL,
    };

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid refresh token.",
    });
  }
}
