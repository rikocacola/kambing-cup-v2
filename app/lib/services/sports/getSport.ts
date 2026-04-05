import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export interface IResponseDataSportDetail {
  id: number;
  name: string;
  image_url: string;
  slug: string;
  tournament_id: number;
  tournament_name?: string;
}

export const getSport = async ({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<ApiResponse<IResponseDataSportDetail | null>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `sport/${id}`,
      options: {
        method: "GET",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "FETCH_SPORT_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const data = await response.json();
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "FETCH_SPORT_ERROR",
      message: "An error occurred while fetching sport!",
    };
  }
};
