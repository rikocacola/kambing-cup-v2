import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";
import type { IResponseDataTournament } from "./getAllTournaments";

export const getActiveTournament = async ({
  token,
}: {
  token: string;
}): Promise<ApiResponse<IResponseDataTournament | null>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: "public/tournament/active",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "FETCH_ACTIVE_TOURNAMENT_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const { data } = await response.json();
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "FETCH_ACTIVE_TOURNAMENT_ERROR",
      message: "An error occurred while fetching active tournament!",
    };
  }
};
