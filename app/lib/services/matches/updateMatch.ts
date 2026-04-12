import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const updateMatch = async ({
  token,
  id,
  body,
}: {
  token: string;
  id: number;
  body: {
    home_id: number | null;
    away_id: number | null;
    home_score: number | null;
    away_score: number | null;
  };
}): Promise<ApiResponse<unknown>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `match/${id}`,
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
        error_code: error.error_code || "UPDATE_MATCH_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "Match updated!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "UPDATE_MATCH_ERROR",
      message: "An error occurred while updating match!",
    };
  }
};
