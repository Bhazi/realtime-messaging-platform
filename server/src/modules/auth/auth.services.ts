import argon2 from "argon2";
import { UserModel } from "../../models/user.model.js";
import crypto from "node:crypto";

interface Signup {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

export class AuthService {
  private static generatePublicUid(): string {
    const value = crypto.randomBytes(6).readUIntBE(0, 6);

    return value.toString(36).toUpperCase().padStart(9, "0").slice(0, 9);
  }

  static async registerUser(data: Signup) {
    const existingUser = await UserModel.findByEmailOrUsername(
      data.email,
      data.username,
    );
    if (existingUser) {
      throw new Error("Username or email already in use.");
    }

    // Argon2id hashing configuration
    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
    });

    const publicUid = this.generatePublicUid();

    return await UserModel.create({
      publicUid,
      username: data.username,
      email: data.email,
      displayName: data.displayName,
      passwordHash,
    });
  }
}
