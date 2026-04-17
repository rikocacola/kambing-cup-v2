import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";
import type { IMatchHistoryImage } from "../matches/getMatchHistory";

interface IDataSportTeamHistory {
  data: IMatchHistoryImage[] | null;
}

export const getSportTeamHistory = async ({
  token,
  sportId,
  teamId,
}: {
  token: string;
  sportId: number;
  teamId: string | number;
}): Promise<ApiResponse<IDataSportTeamHistory>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `match/sport/${sportId}/team/${teamId}/history`,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: { data: null },
        error_code: error.error_code || "FETCH_SPORT_TEAM_HISTORY_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const data = await response.json();
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: { data: null },
      error_code: "FETCH_SPORT_TEAM_HISTORY_ERROR",
      message: "An error occurred while fetching sport team history!",
    };
  }
};
