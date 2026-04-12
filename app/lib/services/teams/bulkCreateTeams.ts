import { authenticatedFetch } from "../apiClient";
import type { ApiResponse } from "../apiClient";

export interface IBulkTeamItem {
  sport_id: number;
  name: string;
  company_name: string;
}

export const bulkCreateTeams = async ({
  token,
  body,
}: {
  token: string;
  body: IBulkTeamItem[];
}): Promise<ApiResponse<null>> => {
  try {
    const response = await authenticatedFetch({
      token,
      path: "team/bulk",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        data: null,
        error_code: error.error_code || "BULK_CREATE_TEAMS_ERROR",
        message: error.message || "Something went wrong!",
      };
    }

    return { success: true, data: null, error_code: "", message: "Teams imported!" };
  } catch {
    return {
      success: false,
      data: null,
      error_code: "BULK_CREATE_TEAMS_ERROR",
      message: "An error occurred while importing teams!",
    };
  }
};
