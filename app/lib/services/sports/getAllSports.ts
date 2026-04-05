import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export interface IResponseDataSport {
  id: number;
  name: string;
  image_url: string;
  slug: string;
  tournament_id: number;
}

export const getAllSports = async ({
  token,
  tournamentId,
}: {
  token: string;
  tournamentId: string;
}): Promise<ApiResponse<IResponseDataSport[] | null>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `sport?tournamentId=${tournamentId}`,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "FETCH_SPORTS_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const { data } = await response.json();
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "FETCH_SPORTS_ERROR",
      message: "An error occurred while fetching sports!",
    };
  }
};
