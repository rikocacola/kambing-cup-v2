import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";
import type { IResponseDataTournament } from "./getAllTournaments";

export const getTournament = async ({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<ApiResponse<IResponseDataTournament | null>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `tournament/${id}`,
      options: {
        method: "GET",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "FETCH_TOURNAMENT_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const { data } = await response.json();
    console.log("Fetched tournament data:", data);
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "FETCH_TOURNAMENT_ERROR",
      message: "An error occurred during fetching tournament!",
    };
  }
};
