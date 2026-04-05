import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const createTeam = async ({
  token,
  body,
}: {
  token: string;
  body: { sport_id: number; name: string };
}): Promise<ApiResponse<null>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: "team",
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
        error_code: error.error_code || "CREATE_TEAM_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "Team created!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "CREATE_TEAM_ERROR",
      message: "An error occurred while creating the team!",
    };
  }
};
