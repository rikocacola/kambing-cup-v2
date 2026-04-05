import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const importTeams = async ({
  token,
  body,
}: {
  token: string;
  body: { sport_id: number; file: File };
}): Promise<ApiResponse<null>> => {
  try {
    const formData = new FormData();
    formData.append("sport_id", String(body.sport_id));
    formData.append("file", body.file);

    const response = await authenticatedFetch({
      token,
      path: "team/import",
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
        error_code: error.error_code || "IMPORT_TEAMS_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "Teams imported!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "IMPORT_TEAMS_ERROR",
      message: "An error occurred while importing teams!",
    };
  }
};
