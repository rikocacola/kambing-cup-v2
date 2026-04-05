import { useEffect, useState } from "react";
import { useActionData, useNavigation, Form } from "react-router";
import { getSport } from "~/lib/services/sports/getSport";
import { getAllTeams } from "~/lib/services/teams/getAllTeams";
import { generateTeams } from "~/lib/services/teams/generateTeams";
import { Button } from "~/lib/components/ui/button";
import { Input } from "~/lib/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import type { Route } from "./+types/sport-detail";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sport Detail" }];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token) return { sport: null, teams: [] };

  const [sportRes, teamsRes] = await Promise.all([
    getSport({ token, id: params.sportId }),
    getAllTeams({ token, sportId: params.sportId }),
  ]);

  return {
    sport: sportRes.success ? sportRes.data : null,
    teams: teamsRes.success ? teamsRes.data : [],
  };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token) return { success: false, error_code: "UNAUTHORIZED", message: "Unauthorized" };

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "generate_teams") {
    const teamCount = Number(formData.get("team_count"));
    const response = await generateTeams({
      token,
      body: { sport_id: Number(params.sportId), team_count: teamCount },
    });
    return { ...response, _action };
  }

  return { success: false, error_code: "UNKNOWN_ACTION", message: "Unknown action" };
}

type Team = {
  id: string;
  name: string;
};

const SportDetail = ({ loaderData }: Route.ComponentProps) => {
  const { sport, teams } = loaderData;
  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();

  const [generateOpen, setGenerateOpen] = useState(false);

  const isGenerating =
    navigation.state === "submitting" &&
    navigation.formData?.get("_action") === "generate_teams";

  useEffect(() => {
    if (actionData?.success && actionData._action === "generate_teams") {
      setGenerateOpen(false);
    }
  }, [navigation.state, actionData]);

  if (!sport) {
    return (
      <div className="text-center text-gray-500 py-8">Sport not found</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{sport.name}</h1>
      {sport.tournament_name && (
        <p className="text-gray-500 text-sm mb-6">{sport.tournament_name}</p>
      )}
      <img
        src={sport.image_url}
        alt={sport.name}
        className="w-full h-64 object-cover rounded-lg mb-8"
      />

      {/* Teams section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Teams</h2>
        <Button size="sm" onClick={() => setGenerateOpen(true)}>
          Generate Teams
        </Button>
      </div>

      {actionData && !actionData.success && (
        <p className="text-red-500 text-sm mb-4">{actionData.message}</p>
      )}

      {teams && teams.length > 0 ? (
        <div className="flex flex-col gap-3">
          {teams.map((team: Team) => (
            <div
              key={team.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 p-4"
            >
              <span className="flex-1 font-medium text-gray-800">
                {team.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-10 border border-dashed rounded-xl">
          No teams yet. Generate teams to get started.
        </div>
      )}

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Teams</DialogTitle>
          </DialogHeader>
          <Form className="flex flex-col gap-5 pt-2" method="POST">
            <input type="hidden" name="_action" value="generate_teams" />
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="team-count">Team Count</Label>
              <Input
                type="number"
                id="team-count"
                name="team_count"
                placeholder="Enter number of teams"
                min={2}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGenerateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SportDetail;
