import argon2 from "argon2";
import { UserModel } from "../../models/user.model.js";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_123";

interface Signup {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

export class AuthService {
  // Generate random 9-character uppercase public UID e.g. 8KX94P92M
  private static generateUid(): string {
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

    const uid = this.generateUid();

    return await UserModel.create({
      uid,
      username: data.username,
      email: data.email,
      displayName: data.displayName,
      passwordHash,
    });
  }

  static async loginUser(identifier: string, plainPassword: string) {
    const user = await UserModel.findByIdentifier(identifier);

    if (!user) {
      throw new Error("Invalid username/email or password.");
    }

    // Verify hashed password with Argon2
    const isPasswordValid = await argon2.verify(
      user.password_hash,
      plainPassword,
    );
    if (!isPasswordValid) {
      throw new Error("Invalid username/email or password.");
    }

    // Issue JWT Token
    const token = jwt.sign(
      { userId: user.id, publicUid: user.public_uid },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Omit sensitive password_hash before returning user object
    const { password_hash, ...safeUser } = user;

    return { user: safeUser, token };
  }
}
