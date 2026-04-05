import { authenticatedFetch } from "../apiClient";

export const deleteSport = async ({
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
      options: { method: "DELETE" },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Something went wrong!" };
    }

    return { success: true, data: { message: "Sport deleted!" }, error: null };
  } catch {
    return { success: false, error: "An error occurred during deleting sport!" };
  }
};
