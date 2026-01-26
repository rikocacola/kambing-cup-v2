import { authenticatedFetch } from "../apiClient";

export const deleteTournament = async ({
  token,
  id,
}: {
  token: string;
  id: string;
}) => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `tournament/${id}`,
      options: {
        method: "DELETE",
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
      error: "An error occurred during deleting tournament!",
    };
  }
};
