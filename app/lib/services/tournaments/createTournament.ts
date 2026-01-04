import { authenticatedFetch } from "../apiClient";

export const postTournaments = async ({
  token,
  body,
}: {
  token: string;
  body: {
    name: string;
    file: any;
  };
}) => {
  try {
    const formData = new FormData();
    formData.append("name", body.name);
    formData.append("file", body.file);
    const response = await authenticatedFetch({
      token,
      path: "tournament",
      options: {
        method: "POST",
        body: formData,
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
    console.log("data", data);
    return { success: true, data, error: null };
  } catch (error) {
    return {
      success: false,
      error: "An error occurred during fetching tournaments!",
    };
  }
};
