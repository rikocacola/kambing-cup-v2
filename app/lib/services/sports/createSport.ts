import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const createSport = async ({
  token,
  body,
}: {
  token: string;
  body: { tournament_id: string; name: string; image: File };
}): Promise<ApiResponse<unknown>> => {
  try {
    const formData = new FormData();
    formData.append("tournament_id", body.tournament_id);
    formData.append("name", body.name);
    formData.append("image", body.image);

    const response = await authenticatedFetch({
      token,
      path: "sport",
      options: { method: "POST", body: formData },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "CREATE_SPORT_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "Sport created!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "CREATE_SPORT_ERROR",
      message: "An error occurred while creating the sport!",
    };
  }
};
