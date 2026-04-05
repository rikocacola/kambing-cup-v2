import { authenticatedFetch } from "../apiClient";

export const updateSport = async ({
  token,
  id,
  body,
}: {
  token: string;
  id: string;
  body: { name: string; image?: File };
}) => {
  try {
    const formData = new FormData();
    formData.append("name", body.name);
    if (body.image && body.image.size > 0) {
      formData.append("image", body.image);
    }

    const response = await authenticatedFetch({
      token,
      path: `sport/${id}`,
      options: { method: "PUT", body: formData },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error || "Something went wrong!" };
    }

    return { success: true, data: { message: "Sport updated!" }, error: null };
  } catch {
    return { success: false, error: "An error occurred during updating sport!" };
  }
};
