import { authenticatedFetch } from "../apiClient";

export const createSport = async ({
  token,
  body,
}: {
  token: string;
  body: { tournament_id: string; name: string; image: File };
}) => {
  try {
    const formData = new FormData();
    formData.append("tournament_id", body.tournament_id);
    formData.append("name", body.name);
    formData.append("image", body.image);

    const response = await authenticatedFetch({
      token,
      path: "sport",
      options: { method: "POST", body: formData },
    });

    if (!response.ok) {
      console.log("Error creating sport:", response);
      const error = await response.json();
      return {
        success: false,
        error: error || "Something went wrong!",
      };
    }

    return { success: true, data: { message: "Sport created!" }, error: null };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error || "An error occurred while creating the sport!",
      },
    };
  }
};
