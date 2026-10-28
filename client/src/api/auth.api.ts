import { apiFetch } from "./apiClient";

import {
  SignupPayload,
  SignupResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
} from "../types/types";

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await fetch("http://localhost:5000/api/v1/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        (data as LoginResponse & { error?: string }).error ||
          "Failed to log in.",
      );
    }

    return data;
  },

  logout: async (): Promise<LogoutResponse> => {
    const response = await apiFetch("/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to log out.");
    }

    return response.json();
  },

  signup: async (payload: SignupPayload): Promise<SignupResponse> => {
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
