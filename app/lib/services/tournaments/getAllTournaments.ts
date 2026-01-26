import { authenticatedFetch } from "../apiClient";

export const getAllTournaments = async ({ token }: { token: string }) => {
  try {
    const response = await authenticatedFetch({
      token,
      path: "tournament",
      options: {
        method: "GET",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Something went wrong!",
      };
    }

    const data = await response.json();
    return { success: true, data, error: null };
  } catch (error) {
    return {
      success: false,
      error: "An error occurred during fetching tournaments!",
    };
  }
};
