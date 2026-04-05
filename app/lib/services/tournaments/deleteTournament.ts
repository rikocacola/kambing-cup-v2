import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const deleteTournament = async ({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<ApiResponse<unknown>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `tournament/${id}`,
      options: {
        method: "DELETE",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "DELETE_TOURNAMENT_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return {
      success: true,
      data: null,
      error_code: "",
      message: "Success Delete Tournament",
    };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "DELETE_TOURNAMENT_ERROR",
      message: "An error occurred during deleting tournament!",
    };
  }
};
