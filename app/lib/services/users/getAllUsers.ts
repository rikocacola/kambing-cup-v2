import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export type IResponseDataUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

export const getAllUsers = async ({
  token,
}: {
  token: string;
}): Promise<ApiResponse<IResponseDataUser[]>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: "user/all",
      options: { method: "GET" },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: [],
        error_code: error.error_code || "GET_USERS_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const data = await response.json();

    console.log("API response data:", data);

    return {
      success: true,
      data: data?.data || [],
      error_code: "",
      message: "",
    };
  } catch {
    return {
      success: false,
      data: [],
      error_code: "GET_USERS_ERROR",
      message: "An error occurred during fetching users!",
    };
  }
};
