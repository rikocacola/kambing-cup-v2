import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export interface IResponseDataTeam {
  id: number;
  name: string;
  sport_id: number;
  company_name: string;
}

export interface IResponseDataTeams {
  data: IResponseDataTeam[] | null;
}

export const getAllTeams = async ({
  token,
  sportId,
}: {
  token: string;
  sportId: string;
}): Promise<ApiResponse<IResponseDataTeams>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `team?sportId=${sportId}`,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: {
          data: null,
        },
        error_code: error.error_code || "FETCH_TEAMS_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const data = await response.json();
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: {
        data: null,
      },
      error_code: "FETCH_TEAMS_ERROR",
      message: "An error occurred while fetching teams!",
    };
  }
};
