import { authenticatedFetch } from "../apiClient";

export const getSport = async ({
  token,
  id,
}: {
  token: string;
  id: string;
}) => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `sport/${id}`,
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
  } catch {
    return {
      success: false,
      error: "An error occurred while fetching sport!",
    };
  }
};
