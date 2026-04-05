import { authenticatedFetch } from "../apiClient";

export const getAllSports = async ({
  token,
  tournamentId,
}: {
  token: string;
  tournamentId: string;
}) => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `sport?tournamentId=${tournamentId}`,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Something went wrong!",
      };
    }

    const data = await response.json();
    console.log("Fetched sports:", data);
    return { success: true, data, error: null };
  } catch {
    return {
      success: false,
      error: "An error occurred while fetching sports!",
    };
  }
};
