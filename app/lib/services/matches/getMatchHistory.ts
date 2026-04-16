import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export interface IMatchHistoryImage {
  id: number;
  match_id: number;
  team_id: number;
  image_url: string;
  created_at: string;
}

interface IDataMatchHistory {
  data: IMatchHistoryImage[] | null;
}

export const getMatchHistory = async ({
  token,
  matchId,
  teamId,
}: {
  token: string;
  matchId: number;
  teamId: string | number;
}): Promise<ApiResponse<IDataMatchHistory>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `match/${matchId}/history/${teamId}`,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: { data: null },
        error_code: error.error_code || "FETCH_MATCH_HISTORY_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const data = await response.json();
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: { data: null },
      error_code: "FETCH_MATCH_HISTORY_ERROR",
      message: "An error occurred while fetching match history!",
    };
  }
};
