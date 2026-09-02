import "express";
export default interface UserRow {
  id: string;
  uid: string;
  username: string;
  email: string;
  displayName: string;
  passwordHash: string;
  avatarUrl: string;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        publicUid: string;
      };

      refreshAuth?: {
        userId: string;
        sessionId: string;
        remainingTTL: number;
      };
    }
  }
}

export {};
