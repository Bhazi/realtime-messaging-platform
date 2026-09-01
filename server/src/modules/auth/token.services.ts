import crypto from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  publicUid: string;
  type: "access";
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  type: "refresh";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export class TokenService {
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  static createAccessToken(id: string, uid: string): string {
    const payload: AccessTokenPayload = {
      sub: id,
      publicUid: uid,
      type: "access",
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: "30m",
    });
  }

  static createRefreshToken(
    id: string,
    sessionId: string,
    remainingTTL?: number,
  ): string {
    const payload: RefreshTokenPayload = {
      sub: id,
      jti: sessionId,
      type: "refresh",
    };

    const expiresIn = remainingTTL ?? 7 * 24 * 60 * 60;

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn,
    });
  }

  static createAuthTokens(
    id: string,
    uid: string,
    remainingTTL?: number,
  ): AuthTokens {
    const sessionId = this.generateSessionId();

    const accessToken = this.createAccessToken(id, uid);

    const refreshToken = this.createRefreshToken(id, sessionId, remainingTTL);

    return {
      accessToken,
      refreshToken,
      sessionId,
    };
  }

  static verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;

    if (
      decoded.type !== "access" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.publicUid !== "string"
    ) {
      throw new Error("Invalid access token");
    }

    return decoded;
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    const decoded = jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;

    if (
      decoded.type !== "refresh" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.jti !== "string"
    ) {
      throw new Error("Invalid refresh token");
    }

    return decoded;
  }

  static hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token, "utf8").digest("hex");
  }
}
