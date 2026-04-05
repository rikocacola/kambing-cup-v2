import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export interface IResponseDataTournament {
  id: number;
  name: string;
  slug: string;
  is_show: boolean;
  is_active: boolean;
  image_url: string;
  total_surah: number;
}

export const getAllTournaments = async ({
  token,
}: {
  token: string;
}): Promise<ApiResponse<IResponseDataTournament[] | null>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: "tournament",
      options: {
        method: "GET",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "FETCH_TOURNAMENTS_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const { data } = await response.json();
    console.log("Fetched tournaments:", data);
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "FETCH_TOURNAMENTS_ERROR",
      message: "An error occurred during fetching tournaments!",
    };
  }
};
