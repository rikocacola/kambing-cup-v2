import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const updateTeam = async ({
  token,
  id,
  body,
}: {
  token: string;
  id: number;
  body: { name?: string; company_name?: string; image?: File };
}): Promise<ApiResponse<null>> => {
  try {
    const formData = new FormData();
    if (body.image) formData.append("image", body.image);
    if (body.name !== undefined) formData.append("name", body.name);
    if (body.company_name !== undefined) formData.append("company_name", body.company_name);

    const response = await authenticatedFetch({
      token,
      path: `team/${id}`,
      options: { method: "PUT", body: formData },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "UPDATE_TEAM_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "Team updated!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "UPDATE_TEAM_ERROR",
      message: "An error occurred while updating team!",
    };
  }
};
