import { pool } from "../config/db.js";

export interface UserRow {
  id: string;
  public_uid: string;
  username: string;
  email: string;
  display_name: string;
  password_hash: string;
  avatar_url: string;
  created_at: Date;
}

export class UserModel {
  static async findByEmailOrUsername(email: string, username: string): Promise {
    const query = `
      SELECT * FROM users
      WHERE email = $1 OR username = $2
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [email, username]);
    return rows[0] || null;
  }

  static async create(userData: {
    publicUid: string;
    username: string;
    email: string;
    displayName: string;
    passwordHash: string;
  }): Promise {
    const query = `
      INSERT INTO users (public_uid, username, email, display_name, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, public_uid, username, email, display_name, avatar_url, created_at;
    `;

    const { rows } = await pool.query(query, [
      userData.publicUid,
      userData.username,
      userData.email,
      userData.displayName,
      userData.passwordHash,
    ]);
    return rows[0];
  }

  static async findByIdentifier(identifier: string): Promise {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 OR username = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [identifier]);
    return rows[0] || null;
  }
}
