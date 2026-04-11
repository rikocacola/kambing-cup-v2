import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const createUser = async ({
  token,
  body,
}: {
  token: string;
  body: { username: string; email: string; role: string; password: string };
}): Promise<ApiResponse<unknown>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: "user",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "CREATE_USER_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "User created!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "CREATE_USER_ERROR",
      message: "An error occurred during creating user!",
    };
  }
};
