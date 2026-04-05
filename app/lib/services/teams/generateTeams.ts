import { authenticatedFetch } from "../apiClient";

export const generateTeams = async ({
  token,
  body,
}: {
  token: string;
  body: { sport_id: number; team_count: number };
}) => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `team/generate`,
      options: {
        method: "POST",
        body: JSON.stringify(body),
      },
    });

    console.log("Response from generateTeams:", response);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Something went wrong!",
      };
    }

    return {
      success: true,
      data: { message: "Teams generated!" },
      error: null,
    };
  } catch {
    return {
      success: false,
      error: "An error occurred while generating teams!",
    };
  }
};
