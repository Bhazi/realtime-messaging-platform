import { Request, Response } from "express";
import { AuthService } from "./auth.services.js";

export class AuthController {
  static async signup(req: Request, res: Response): Promise {
    console.log(req.body);

    try {
      const { username, email, displayName, password } = req.body;

      if (!username || !email || !displayName || !password) {
        res.status(400).json({ error: "All fields are required." });
        return;
      }

      const user = await AuthService.registerUser({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        password,
      });

      console.log(user, " from the user");

      res.status(201).json({ message: "User created successfully", user });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Signup failed." });
    }
  }

  static async login(req: Request, res: Response): Promise {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        res
          .status(400)
          .json({ error: "Please enter your username/email and password." });
        return;
      }

      const cleanIdentifier = identifier.trim().toLowerCase();
      const result = await AuthService.loginUser(cleanIdentifier, password);

      res.status(200).json({
        message: "Login successful",
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      res.status(401).json({ error: err.message || "Authentication failed." });
    }
  }
}
