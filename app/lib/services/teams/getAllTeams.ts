import { authenticatedFetch } from "../apiClient";

export const getAllTeams = async ({
  token,
  sportId,
}: {
  token: string;
  sportId: string;
}) => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `team?sportId=${sportId}`,
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
  } catch {
    return {
      success: false,
      error: "An error occurred while fetching teams!",
    };
  }
};
