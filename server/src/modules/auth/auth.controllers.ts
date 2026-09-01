import { Request, Response } from "express";
import { AuthService } from "./auth.services.js";

// const ACCESS_COOKIE_NAME = "__Host-access_token";
// const REFRESH_COOKIE_NAME = "__Host-refresh_token";

const isProduction = process.env.NODE_ENV === "production";

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

export interface RefreshAuthenticatedRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
    remainingTTL: number;
  };
}

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
};

export class AuthController {
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, displayName, password } = req.body;

      if (!username || !email || !displayName || !password) {
        res.status(400).json({
          error: "All fields are required.",
        });
        return;
      }

      const result = await AuthService.registerUser({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        password,
      });

      res
        .cookie(ACCESS_COOKIE_NAME, result.accessToken, {
          ...cookieOptions,
          maxAge: 30 * 60 * 1000,
        })
        .cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .status(201)
        .json({
          message: "User created successfully",
          user: result.user,
        });
    } catch (err: any) {
      res.status(400).json({
        error: err.message || "Signup failed.",
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        res.status(400).json({
          error: "Please enter your username/email and password.",
        });
        return;
      }

      const cleanIdentifier = identifier.trim().toLowerCase();

      const result = await AuthService.loginUser(cleanIdentifier, password);

      res
        .cookie(ACCESS_COOKIE_NAME, result.accessToken, {
          ...cookieOptions,
          maxAge: 30 * 60 * 1000,
        })
        .cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .status(200)
        .json({
          message: "Login successful",
          user: result.user,
        });
    } catch (err: any) {
      res.status(401).json({
        error: err.message || "Authentication failed.",
      });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    console.log("called here");

    const authReq = req as RefreshAuthenticatedRequest;

    try {
      const tokens = await AuthService.refreshAccessToken(
        authReq.auth.userId,
        authReq.auth.sessionId,
        authReq.auth.remainingTTL,
      );

      res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
        ...cookieOptions,
        maxAge: 30 * 60 * 1000,
      });

      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
        ...cookieOptions,
        maxAge: authReq.auth.remainingTTL * 1000,
      });

      res.status(200).json({
        message: "Tokens refreshed successfully.",
      });
    } catch (error) {
      res.status(401).json({
        message: "Unable to refresh authentication.",
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

      /*
       * If there is a refresh token, revoke the
       * corresponding Redis session.
       */
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      /*
       * Remove both authentication cookies.
       */
      res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions);

      res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);

      res.status(200).json({
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);

      /*
       * Even if Redis/token processing fails,
       * clear the cookies.
       */
      res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions);

      res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);

      res.status(200).json({
        message: "Logout successful",
      });
    }
  }
}
