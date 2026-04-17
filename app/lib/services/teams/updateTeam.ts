import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const updateTeam = async ({
  token,
  id,
  body,
}: {
  token: string;
  id: number;
  body: { name?: string; company_name?: string };
}): Promise<ApiResponse<null>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `team/${id}`,
      options: {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "UPDATE_TEAM_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "Team updated!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "UPDATE_TEAM_ERROR",
      message: "An error occurred while updating team!",
    };
  }
};
