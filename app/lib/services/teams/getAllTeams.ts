import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export interface IResponseDataTeam {
  id: number;
  name: string;
}

export const getAllTeams = async ({
  token,
  sportId,
}: {
  token: string;
  sportId: string;
}): Promise<ApiResponse<IResponseDataTeam[] | null>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `team?sportId=${sportId}`,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "FETCH_TEAMS_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const data = await response.json();
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "FETCH_TEAMS_ERROR",
      message: "An error occurred while fetching teams!",
    };
  }
};
