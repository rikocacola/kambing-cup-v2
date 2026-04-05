import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const createTournament = async ({
  token,
  body,
}: {
  token: string;
  body: {
    name: string;
    image: File;
    total_surah: string;
  };
}): Promise<ApiResponse<unknown>> => {
  try {
    const formData = new FormData();
    formData.append("name", body.name);
    formData.append("image", body.image);
    formData.append("total_surah", body.total_surah);
    const response = await authenticatedFetch({
      token,
      path: "tournament",
      options: {
        method: "POST",
        body: formData,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "CREATE_TOURNAMENT_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return {
      success: true,
      data: null,
      error_code: "",
      message: "Tournaments created!",
    };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "CREATE_TOURNAMENT_ERROR",
      message: "An error occurred during creating tournaments!",
    };
  }
};
