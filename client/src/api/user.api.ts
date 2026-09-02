import { User, MemberRole } from "../types/types";
import { apiFetch } from "./apiClient";

export const userApi = {
  addUserToGroup: async (
    conversationId: string,
    currentUserId: string,
    targetUid: string,
  ): Promise<void> => {
    const response = await apiFetch("/users/group/add-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId,
        currentUserId,
        targetUid,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add user to group.");
    }
  },

  changePassword: async (
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    const response = await apiFetch("/users/password/change", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        oldPassword,
        newPassword,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to change password");
    }

    return result.success; // Returns true
  },

  deleteGroupConversation: async (
    conversationId: string,
    currentUserId: string,
  ): Promise<void> => {
    const response = await apiFetch(`/users/group/${conversationId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUserId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to delete group conversation.",
      );
    }
  },

  deleteDirectConversation: async (
    conversationId: string,
    currentUserId: string,
  ): Promise<void> => {
    const response = await apiFetch(`/users/direct/${conversationId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUserId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to delete direct conversation.",
      );
    }
  },

  getUsers: async () => {
    const token = localStorage.getItem("auth_token");

    const response = await apiFetch("/users", {
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

  getUserById: async (id: string): Promise<User | undefined> => {
    try {
      const response = await apiFetch(`/user/id/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error("Failed to fetch user by ID");

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return undefined;
    }
  },

  getUserByUid: async (uid: string): Promise<User | undefined> => {
    try {
      const response = await apiFetch(`/users/uid/${uid}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error("Failed to fetch user by UID");

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error fetching user by UID:", error);
      return undefined;
    }
  },

  me: async () => {
    try {
      const result = await apiFetch("/users/me", {
        method: "GET",
        credentials: "include",
        headers: { "Content-type": "application/json" },
      });

      const data = await result.json();
      return data.user;
    } catch (error) {
      console.log(error, "from the me error");
    }
  },

  removeUserFromGroup: async (
    conversationId: string,
    currentUserId: string,
    targetUserId: string,
  ): Promise<void> => {
    const response = await apiFetch(
      `/users/groups/${conversationId}/members/${targetUserId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentUserId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove user from group.");
    }
  },

  updateAvatar: async (formData: any): Promise<User> => {
    const response = await apiFetch("/users/profile/avatar", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    return result.user;
  },

  updateGroupMemberRole: async (
    conversationId: string,
    currentUserId: string,
    targetUserId: string,
    newRole: MemberRole,
  ): Promise<void> => {
    const response = await apiFetch(
      `/users/groups/${conversationId}/members/role`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentUserId, targetUserId, newRole }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update member role.");
    }
  },

  updateUserProfile: async (
    userId: string,
    updates: Partial<User>,
  ): Promise<User> => {
    const response = await apiFetch("/users/profile/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        updates,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update profile");
    }

    const result = await response.json();
    const updatedUser: User = result.user;

    return updatedUser;
  },
};
