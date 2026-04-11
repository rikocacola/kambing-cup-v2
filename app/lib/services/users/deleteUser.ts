import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const deleteUser = async ({
  token,
  id,
}: {
  token: string;
  id: number;
}): Promise<ApiResponse<unknown>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `users/${id}`,
      options: { method: "DELETE" },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "DELETE_USER_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "User deleted!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "DELETE_USER_ERROR",
      message: "An error occurred during deleting user!",
    };
  }
};
