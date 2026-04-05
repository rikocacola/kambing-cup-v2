import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const generateTeams = async ({
  token,
  body,
}: {
  token: string;
  body: { sport_id: number; team_count: number };
}): Promise<ApiResponse<unknown>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `team/generate`,
      options: {
        method: "POST",
        body: JSON.stringify(body),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "GENERATE_TEAMS_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return {
      success: true,
      data: null,
      error_code: "",
      message: "Teams generated!",
    };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "GENERATE_TEAMS_ERROR",
      message: "An error occurred while generating teams!",
    };
  }
};
