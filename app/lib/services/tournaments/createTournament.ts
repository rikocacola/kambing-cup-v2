import { authenticatedFetch } from "../apiClient";

export const createTournament = async ({
  token,
  body,
}: {
  token: string;
  body: {
    name: string;
    image: File;
  };
}) => {
  try {
    const formData = new FormData();
    formData.append("name", body.name);
    formData.append("image", body.image);
    const response = await authenticatedFetch({
      token,
      path: "tournament",
      options: {
        method: "POST",
        body: formData,
      },
    });
    console.log("response", response);

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
