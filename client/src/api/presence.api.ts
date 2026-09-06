import { User, MemberRole } from "../types/types";
import { apiFetch } from "./apiClient";

// presenceApi.ts

export const presenceApi = {
  isParticipantOnline: async (targetId: string) => {
    const response = await apiFetch(`/presence/${targetId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();

      throw new Error(errorData.error || "Failed to fetch user presence.");
    }

    const { data } = await response.json();

    return data;
  },

  onlineParticipantsIds: async (userIds: string[]): Promise<string[]> => {
    const response = await apiFetch("/presence/participants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userIds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      throw new Error(
        errorData.error || "Failed to fetch participant presence.",
      );
    }

    const { participantsIds } = await response.json();

    return participantsIds;
  },
};
