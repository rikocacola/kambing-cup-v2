import { authenticatedFetch } from "../apiClient";

export const updateTournament = async ({
  token,
  id,
  body,
}: {
  token: string;
  id: string;
  body: {
    name: string;
    image?: File;
  };
}) => {
  try {
    const formData = new FormData();
    formData.append("name", body.name);
    if (body.image) {
      formData.append("image", body.image);
    }
    const response = await authenticatedFetch({
      token,
      path: `tournament/${id}`,
      options: {
        method: "PUT",
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

    return {
      success: true,
      data: {
        message: "Success Update Tournament",
      },
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: "An error occurred during updating tournament!",
    };
  }
};
