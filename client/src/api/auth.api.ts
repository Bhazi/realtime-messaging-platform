import { apiFetch } from "./apiClient";

export const authApi = {
  login: async (payload: { identifier: string; password: string }) => {
    const response = await fetch("http://localhost:5000/api/v1/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to log in.");
    }
    return data;
  },

  logout: async () => {
    await apiFetch("/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-type": "application/json" },
    });
  },

  signup: async (payload: {
    username: string;
    email: string;
    displayName: string;
    password: string;
  }) => {
    const response = await fetch("http://localhost:5000/api/v1/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to sign up.");
    }
    return data;
  },
};
