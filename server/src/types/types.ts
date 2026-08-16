export default interface UserRow {
  id: string;
  uid: string;
  username: string;
  email: string;
  display_name: string;
  password_hash: string;
  avatar_url: string;
  created_at: Date;
}
