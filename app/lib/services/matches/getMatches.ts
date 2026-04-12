import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export interface IMatch {
  id: number;
  sport_id: number;
  home_id: number | null;
  away_id: number | null;
  home_score: number | null;
  away_score: number | null;
  round_id: number;
  next_round_id: number;
  round: string;
  state: string;
  start_date: string;
  winner: number | null;
}

interface IDataMatches {
  data: IMatch[] | null;
}

export const getMatches = async ({
  token,
  sportId,
}: {
  token: string;
  sportId: string;
}): Promise<ApiResponse<IDataMatches>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: `match?sportId=${sportId}`,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: { data: null },
        error_code: error.error_code || "FETCH_MATCHES_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    const data = await response.json();
    return { success: true, data, error_code: "", message: "" };
  } catch {
    return {
      success: false,
      data: { data: null },
      error_code: "FETCH_MATCHES_ERROR",
      message: "An error occurred while fetching matches!",
    };
  }
};
