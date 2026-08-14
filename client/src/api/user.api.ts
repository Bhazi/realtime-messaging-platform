export const userApi = {
  getUsers: async () => {
    const token = localStorage.getItem("auth_token");

    const response = await fetch("http://localhost:5000/api/v1/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load users.");
    }

    // Map database snake_case keys to React camelCase model
    return data.users.map((u: any) => ({
      id: u.id,
      uid: u.uid,
      username: u.username,
      email: u.email,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      createdAt: u.created_at,
    }));
  },
};
