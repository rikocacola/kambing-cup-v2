import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const updateSport = async ({
  token,
  id,
  body,
}: {
  token: string;
  id: string;
  body: { name: string; image?: File; tournament_id?: string };
}): Promise<ApiResponse<unknown>> => {
  try {
    const formData = new FormData();
    formData.append("name", body.name);
    if (body.tournament_id) {
      formData.append("tournament_id", body.tournament_id);
    }
    if (body.image && body.image.size > 0) {
      formData.append("image", body.image);
    }

    const response = await authenticatedFetch({
      token,
      path: `sport/${id}`,
      options: { method: "PUT", body: formData },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "UPDATE_SPORT_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "Sport updated!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "UPDATE_SPORT_ERROR",
      message: "An error occurred during updating sport!",
    };
  }
};
