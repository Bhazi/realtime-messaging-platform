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
