import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const updateUser = async ({
  token,
  id,
  body,
}: {
  token: string;
  id: number;
  body: { username: string; email: string; role: string; password?: string };
}): Promise<ApiResponse<unknown>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `user/${id}`,
      options: {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "UPDATE_USER_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "User updated!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "UPDATE_USER_ERROR",
      message: "An error occurred during updating user!",
    };
  }
};
