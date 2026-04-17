import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export const updateMatch = async ({
  token,
  id,
  body,
}: {
  token: string;
  id: number;
  body: {
    home_id: number | null;
    away_id: number | null;
    home_score: number | string | null;
    away_score: number | string | null;
    state: "SOON" | "LIVE" | "DONE";
    sport_id?: number | null;
    winner_id?: number| string | null;
    image?: File | null;
    start_time?: string | null;
  };
}): Promise<ApiResponse<unknown>> => {
  try {
    const formData = new FormData();
    if (body.sport_id !== undefined)
      formData.append("sport_id", String(body.sport_id));
    if (body.home_id !== null && body.home_id !== undefined)
      formData.append("home_id", String(body.home_id));
    if (body.away_id !== null && body.away_id !== undefined)
      formData.append("away_id", String(body.away_id));
    if (body.home_score !== null && body.home_score !== undefined)
      formData.append("home_score", String(body.home_score));
    if (body.away_score !== null && body.away_score !== undefined)
      formData.append("away_score", String(body.away_score));
    if (body.state) formData.append("state", body.state);
    if (body.winner_id !== null && body.winner_id !== undefined)
      formData.append("winner_id", String(body.winner_id));
    if (body.image) formData.append("image", body.image);
    if (body.start_time !== null && body.start_time !== undefined)
      formData.append("start_time", body.start_time);

    const response = await authenticatedFetch({
      token,
      path: `match/${id}`,
      options: {
        method: "PUT",
        body: formData,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "UPDATE_MATCH_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return {
      success: true,
      data: null,
      error_code: "",
      message: "Match updated!",
    };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "UPDATE_MATCH_ERROR",
      message: "An error occurred while updating match!",
    };
  }
};
