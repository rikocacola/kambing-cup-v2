import { useEffect, useRef, useState } from "react";
import { useActionData, useNavigation, Form } from "react-router";
import { ChevronDown, FileSpreadsheet, Plus } from "lucide-react";
import { getSport } from "~/lib/services/sports/getSport";
import type { IResponseDataSportDetail } from "~/lib/services/sports/getSport";
import { getAllTeams } from "~/lib/services/teams/getAllTeams";
import type { IResponseDataTeam } from "~/lib/services/teams/getAllTeams";
import { createTeam } from "~/lib/services/teams/createTeam";
import { importTeams } from "~/lib/services/teams/importTeams";
import { generateTeams } from "~/lib/services/teams/generateTeams";
import { Button } from "~/lib/components/ui/button";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import { cn } from "~/lib/utils";
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
    sport: sportRes.success ? (sportRes.data as IResponseDataSportDetail) : null,
    teams: teamsRes.success ? (teamsRes.data as IResponseDataTeam[]) : [],
  };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token) {
    return { success: false, error_code: "UNAUTHORIZED", message: "Unauthorized", _action: "" };
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "create_team") {
    const name = formData.get("name") as string;
    const response = await createTeam({
      token,
      body: { sport_id: Number(params.sportId), name },
    });
    return { ...response, _action };
  }

  if (_action === "import_teams") {
    const file = formData.get("file") as File;
    const response = await importTeams({
      token,
      body: { sport_id: Number(params.sportId), file },
    });
    return { ...response, _action };
  }

  if (_action === "generate_matches") {
    const teamCount = Number(formData.get("team_count"));
    const response = await generateTeams({
      token,
      body: { sport_id: Number(params.sportId), team_count: teamCount },
    });
    return { ...response, _action };
  }

  return { success: false, error_code: "UNKNOWN_ACTION", message: "Unknown action", _action: "" };
}

const SportDetail = ({ loaderData }: Route.ComponentProps) => {
  const { sport, teams } = loaderData;
  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();

  const [openAccordion, setOpenAccordion] = useState<"teams" | "matches" | null>("teams");
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [generateMatchesOpen, setGenerateMatchesOpen] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const excelFormRef = useRef<HTMLFormElement>(null);

  const isSubmitting = navigation.state === "submitting";
  const currentAction = navigation.formData?.get("_action") as string | undefined;

  useEffect(() => {
    if (!actionData?.success) return;
    if (actionData._action === "create_team") setCreateTeamOpen(false);
    if (actionData._action === "generate_matches") setGenerateMatchesOpen(false);
  }, [actionData]);

  if (!sport) {
    return <div className="text-center text-gray-500 py-8">Sport not found</div>;
  }

  const toggleAccordion = (section: "teams" | "matches") => {
    setOpenAccordion((prev) => (prev === section ? null : section));
  };

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

      <div className="flex flex-col gap-3">
        {/* Teams Accordion */}
        <div className="border rounded-xl overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
            onClick={() => toggleAccordion("teams")}
          >
            <span className="font-semibold text-gray-800">
              Teams {teams && teams.length > 0 ? `(${teams.length})` : ""}
            </span>
            <ChevronDown
              size={18}
              className={cn(
                "text-gray-500 transition-transform duration-200",
                openAccordion === "teams" && "rotate-180",
              )}
            />
          </button>

          {openAccordion === "teams" && (
            <div className="px-5 pb-5 bg-white border-t">
              <div className="flex gap-2 pt-4 pb-4">
                {/* Hidden file input for Excel import */}
                <Form method="post" ref={excelFormRef} encType="multipart/form-data">
                  <input type="hidden" name="_action" value="import_teams" />
                  <input
                    ref={excelInputRef}
                    type="file"
                    name="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={() => excelFormRef.current?.requestSubmit()}
                  />
                </Form>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => excelInputRef.current?.click()}
                  disabled={isSubmitting && currentAction === "import_teams"}
                >
                  <FileSpreadsheet size={15} />
                  {isSubmitting && currentAction === "import_teams"
                    ? "Importing..."
                    : "Import Excel"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCreateTeamOpen(true)}
                >
                  <Plus size={15} />
                  Create Manual
                </Button>
              </div>

              {actionData && !actionData.success && actionData._action === "import_teams" && (
                <p className="text-red-500 text-sm mb-3">{actionData.message}</p>
              )}

              {teams && teams.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {teams.map((team: IResponseDataTeam) => (
                    <div
                      key={team.id}
                      className="bg-gray-50 rounded-lg border border-gray-100 flex items-center px-4 py-3"
                    >
                      <span className="flex-1 font-medium text-gray-800 text-sm">
                        {team.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8 border border-dashed rounded-xl text-sm">
                  No teams yet. Import from Excel or create manually.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Matches Accordion */}
        <div className="border rounded-xl overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
            onClick={() => toggleAccordion("matches")}
          >
            <span className="font-semibold text-gray-800">Matches</span>
            <ChevronDown
              size={18}
              className={cn(
                "text-gray-500 transition-transform duration-200",
                openAccordion === "matches" && "rotate-180",
              )}
            />
          </button>

          {openAccordion === "matches" && (
            <div className="px-5 pb-5 bg-white border-t">
              <div className="flex gap-2 pt-4 pb-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setGenerateMatchesOpen(true)}
                >
                  Generate Matches
                </Button>
              </div>

              {actionData && !actionData.success && actionData._action === "generate_matches" && (
                <p className="text-red-500 text-sm mb-3">{actionData.message}</p>
              )}

              <div className="text-center text-gray-400 py-8 border border-dashed rounded-xl text-sm">
                No matches yet. Generate matches to get started.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
          </DialogHeader>
          <Form className="flex flex-col gap-5 pt-2" method="POST">
            <input type="hidden" name="_action" value="create_team" />
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                type="text"
                id="team-name"
                name="name"
                placeholder="Enter team name"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateTeamOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting && currentAction === "create_team"}
              >
                {isSubmitting && currentAction === "create_team"
                  ? "Creating..."
                  : "Create"}
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Generate Matches Dialog */}
      <Dialog open={generateMatchesOpen} onOpenChange={setGenerateMatchesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Matches</DialogTitle>
          </DialogHeader>
          <Form className="flex flex-col gap-5 pt-2" method="POST">
            <input type="hidden" name="_action" value="generate_matches" />
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
                onClick={() => setGenerateMatchesOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting && currentAction === "generate_matches"}
              >
                {isSubmitting && currentAction === "generate_matches"
                  ? "Generating..."
                  : "Generate"}
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SportDetail;
