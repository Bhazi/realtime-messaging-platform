import argon2 from "argon2";
import { UserModel } from "../../models/user.model.js";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { UserCache } from "../user/user.cache.js";
import { AuthSession, AuthSessionCache } from "./auth.session.cache.js";

import { TokenService } from "./token.services.js";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

interface Signup {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: "refresh";
}

export class AuthService {
  static readonly TTL_7_DAYS = 7 * 24 * 60 * 60;

  // Generate random 9-character uppercase public UID e.g. 8KX94P92M
  private static generateUid(): string {
    const value = crypto.randomBytes(6).readUIntBE(0, 6);

    return value.toString(36).toUpperCase().padStart(9, "0").slice(0, 9);
  }

  static async registerUser(data: Signup) {
    const existingUser = await UserModel.findByEmail(data.email);

    if (existingUser) {
      throw new Error("Username or email already in use.");
    }

    // Argon2id hashing configuration
    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
    });

    const uid = this.generateUid();

    const user = await UserModel.create({
      uid,
      username: data.username,
      email: data.email,
      displayName: data.displayName,
      passwordHash,
    });

    const tokens = TokenService.createAuthTokens(user.id, user.uid);

    const refreshTokenHash = TokenService.hashRefreshToken(tokens.refreshToken);

    const authSession: AuthSession = {
      userId: user.id,
      refreshTokenHash,
      expiresAt: Date.now() + this.TTL_7_DAYS * 1000,
      revoked: false,
    };

    // redis
    await UserCache.setUser(user, 60 * 60);

    await AuthSessionCache.createSession(
      tokens.sessionId,
      authSession,
      this.TTL_7_DAYS,
    );

    // Omit sensitive password_hash before returning user object
    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  static async loginUser(identifier: string, plainPassword: string) {
    const user = await UserModel.findByIdentifier(identifier);

    if (!user) {
      throw new Error("Invalid username/email or password.");
    }

    // Verify hashed password with Argon2
    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      plainPassword,
    );
    if (!isPasswordValid) {
      throw new Error("Invalid username/email or password.");
    }

    const tokens = TokenService.createAuthTokens(user.id, user.uid);

    const refreshTokenHash = TokenService.hashRefreshToken(tokens.refreshToken);

    const authSession: AuthSession = {
      userId: user.id,
      refreshTokenHash,
      expiresAt: Date.now() + this.TTL_7_DAYS * 1000,
      revoked: false,
    };

    // redis
    await UserCache.setUser(user, 60 * 60);

    await AuthSessionCache.createSession(
      tokens.sessionId,
      authSession,
      this.TTL_7_DAYS,
    );

    // Omit sensitive password_hash before returning user object
    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  static async refreshAccessToken(
    userId: string,
    oldSessionId: string,
    remainingTTL: number,
  ) {
    // 1. Get the user
    const user = await UserModel.getUserById(userId);

    if (!user) {
      throw new Error("User not found.");
    }

    // 2. Generate completely new token pair
    const tokens = TokenService.createAuthTokens(
      user.id,
      user.uid,
      remainingTTL,
    );

    // 3. Hash the NEW refresh token
    const newRefreshTokenHash = TokenService.hashRefreshToken(
      tokens.refreshToken,
    );

    // 4. Create the new session
    const newSession: AuthSession = {
      userId: user.id,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: Date.now() + remainingTTL * 1000,
      revoked: false,
    };

    // 5. Revoke OLD session
    await AuthSessionCache.revokeSession(oldSessionId);

    // 6. Store NEW session
    await AuthSessionCache.createSession(
      tokens.sessionId,
      newSession,
      remainingTTL,
    );

    await UserCache.updateUser(user);

    return tokens;
  }

  static async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        JWT_SECRET,
      ) as RefreshTokenPayload;

      if (decoded.type !== "refresh") {
        return;
      }

      await UserCache.deleteUser(decoded.sub);

      const sessionId = decoded.jti;

      await AuthSessionCache.revokeSession(sessionId);
    } catch (error) {
      console.error("Failed to revoke auth session:", error);
    }
  }
}
