import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const updateTournament = async ({
  token,
  id,
  body,
}: {
  token: string;
  id: string;
  body: {
    name: string;
    image?: File;
    is_active?: boolean;
  };
}): Promise<ApiResponse<unknown>> => {
  try {
    const formData = new FormData();
    formData.append("name", body.name);
    formData.append("is_active", String(body.is_active ?? false));
    if (body.image) {
      formData.append("image", body.image);
    }
    const response = await authenticatedFetch({
      token,
      path: `tournament/${id}`,
      options: {
        method: "PUT",
        body: formData,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "UPDATE_TOURNAMENT_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return {
      success: true,
      data: null,
      error_code: "",
      message: "Success Update Tournament",
    };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "UPDATE_TOURNAMENT_ERROR",
      message: "An error occurred during updating tournament!",
    };
  }
};
