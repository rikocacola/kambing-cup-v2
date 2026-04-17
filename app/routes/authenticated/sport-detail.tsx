import { useEffect, useRef, useState } from "react";
import {
  useActionData,
  useNavigation,
  useRevalidator,
  Form,
} from "react-router";
import { read, utils } from "xlsx";
import { toast } from "sonner";
import { ChevronDown, FileSpreadsheet, Plus } from "lucide-react";
import { getSport } from "~/lib/services/sports/getSport";
import type { IResponseDataSportDetail } from "~/lib/services/sports/getSport";
import { getAllTeams } from "~/lib/services/teams/getAllTeams";
import type {
  IResponseDataTeam,
  IResponseDataTeams,
} from "~/lib/services/teams/getAllTeams";
import { createTeam } from "~/lib/services/teams/createTeam";
import { bulkCreateTeams } from "~/lib/services/teams/bulkCreateTeams";
import { generateTeams } from "~/lib/services/teams/generateTeams";
import { getMatches } from "~/lib/services/matches/getMatches";
import type { IMatch } from "~/lib/services/matches/getMatches";
import { updateMatch } from "~/lib/services/matches/updateMatch";
import { updateTeam } from "~/lib/services/teams/updateTeam";
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
import { BASE_URL } from "~/lib/services/auth/loginService";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sport Detail" }];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token) return { sport: null, teams: [], matches: [] };

  const [sportRes, teamsRes, matchesRes] = await Promise.all([
    getSport({ token, id: params.sportId }),
    getAllTeams({ token, sportId: params.sportId }),
    getMatches({ token, sportId: params.sportId }),
  ]);

  return {
    sport: sportRes.success
      ? (sportRes.data as IResponseDataSportDetail).data
      : null,
    teams: teamsRes.success
      ? (teamsRes.data as IResponseDataTeams).data?.filter(
          (item) => item.sport_id === Number(params.sportId),
        )
      : [],
    matches: matchesRes.success ? (matchesRes.data?.data as IMatch[]) : [],
  };
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token) {
    return {
      success: false,
      error_code: "UNAUTHORIZED",
      message: "Unauthorized",
      _action: "",
    };
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

  if (_action === "generate_matches") {
    const teamCount = Number(formData.get("team_count"));
    const response = await generateTeams({
      token,
      body: { sport_id: Number(params.sportId), team_count: teamCount },
    });
    return { ...response, _action };
  }

  if (_action === "update_team") {
    const teamId = Number(formData.get("team_id"));
    const name = formData.get("name") as string;
    const companyName = formData.get("company_name") as string;
    const response = await updateTeam({
      token,
      id: teamId,
      body: { name, company_name: companyName },
    });
    return { ...response, _action };
  }

  if (_action === "update_match") {
    const matchId = Number(formData.get("match_id"));
    const homeIdRaw = formData.get("home_id") as string;
    const awayIdRaw = formData.get("away_id") as string;
    const homeScoreRaw = formData.get("home_score") as string;
    const awayScoreRaw = formData.get("away_score") as string;
    const startTimeRaw = formData.get("start_time") as string;

    // Convert datetime-local to RFC3339 format
    let startTimeRfc3339: string | null = null;
    if (startTimeRaw) {
      const date = new Date(startTimeRaw);
      startTimeRfc3339 = date.toISOString();
    }

    const response = await updateMatch({
      token,
      id: matchId,
      body: {
        sport_id: Number(params.sportId),
        home_id: homeIdRaw ? Number(homeIdRaw) : null,
        away_id: awayIdRaw ? Number(awayIdRaw) : null,
        home_score: homeScoreRaw !== "" ? Number(homeScoreRaw) : null,
        away_score: awayScoreRaw !== "" ? Number(awayScoreRaw) : null,
        state: "SOON",
        start_time: startTimeRfc3339,
      },
    });
    return { ...response, _action };
  }

  return {
    success: false,
    error_code: "UNKNOWN_ACTION",
    message: "Unknown action",
    _action: "",
  };
}

function groupMatchesByRound(matches: IMatch[]): Map<string, IMatch[]> {
  const map = new Map<string, IMatch[]>();
  for (const match of matches) {
    const existing = map.get(match.round) ?? [];
    existing.push(match);
    map.set(match.round, existing);
  }
  return map;
}

const SportDetail = ({ loaderData }: Route.ComponentProps) => {
  const { sport, teams, matches } = loaderData;
  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();
  const { revalidate } = useRevalidator();

  const [openAccordion, setOpenAccordion] = useState<
    "teams" | "matches" | null
  >("teams");
  const [openRound, setOpenRound] = useState<string | null>(null);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [generateMatchesOpen, setGenerateMatchesOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<IMatch | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<IResponseDataTeam | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = navigation.state === "submitting";
  const currentAction = navigation.formData?.get("_action") as
    | string
    | undefined;

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      if (actionData._action === "create_team") {
        setCreateTeamOpen(false);
        toast.success("Team created successfully!");
      }
      if (actionData._action === "generate_matches") {
        setGenerateMatchesOpen(false);
        toast.success("Matches generated successfully!");
      }
      if (actionData._action === "update_match") {
        setSelectedMatch(null);
        toast.success("Match updated successfully!");
      }
      if (actionData._action === "update_team") {
        setSelectedTeam(null);
        toast.success("Team updated successfully!");
      }
    } else {
      if (actionData.message) toast.error(actionData.message);
    }
  }, [actionData]);

  if (!sport) {
    return (
      <div className="text-center text-gray-500 py-8">Sport not found</div>
    );
  }

  const toggleAccordion = (section: "teams" | "matches") => {
    setOpenAccordion((prev) => (prev === section ? null : section));
  };

  const toggleRound = (round: string) => {
    setOpenRound((prev) => (prev === round ? null : round));
  };

  const matchesByRound = groupMatchesByRound(matches ?? []);

  const getTeamName = (id: number | null) => {
    if (!id) return "TBD";
    return teams?.find((t) => t.id === id)?.name ?? "TBD";
  };

  const getCompanyName = (id: number | null) => {
    if (!id) return null;
    return teams?.find((t) => t.id === id)?.company_name ?? null;
  };

  const formatDateTime = (dateTimeString?: string | null) => {
    if (!dateTimeString) return "—";
    try {
      const date = new Date(dateTimeString);
      return (
        date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " " +
        date.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    } catch {
      return "—";
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sport) return;

    setIsImporting(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, unknown>>(sheet);

      const payload = rows
        .map((row) => ({
          sport_id: sport.id,
          name: String(row["Name"] ?? "").trim(),
          company_name: String(row["Company Name"] ?? "").trim(),
        }))
        .filter((item) => item.name);

      const token = localStorage.getItem("accessToken") ?? "";
      const res = await bulkCreateTeams({ token, body: payload });

      if (res.success) {
        toast.success("Teams imported successfully!");
        revalidate();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to parse the Excel file.");
    } finally {
      setIsImporting(false);
      if (excelInputRef.current) excelInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{sport.name}</h1>
      {sport.tournament_name && (
        <p className="text-gray-500 text-sm mb-6">{sport.tournament_name}</p>
      )}
      <div className="w-full aspect-video mb-8">
        <img
          src={`${BASE_URL}${sport.image_url}`}
          alt={sport.name}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

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
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleExcelImport}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => excelInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <FileSpreadsheet size={15} />
                  {isImporting ? "Importing..." : "Import Excel"}
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

              {teams && teams.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {teams.map((team: IResponseDataTeam) => (
                    <button
                      key={team.id}
                      type="button"
                      className="w-full bg-gray-50 rounded-lg border border-gray-100 flex items-center px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                      onClick={() => setSelectedTeam(team)}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="font-medium text-gray-800 text-sm">
                          {team.name}
                        </span>
                        {team.company_name && (
                          <span className="text-xs text-gray-400">
                            {team.company_name}
                          </span>
                        )}
                      </div>
                    </button>
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
            <span className="font-semibold text-gray-800">
              Matches{" "}
              {matches && matches.length > 0 ? `(${matches.length})` : ""}
            </span>
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

              {actionData &&
                !actionData.success &&
                actionData._action === "generate_matches" && (
                  <p className="text-red-500 text-sm mb-3">
                    {actionData.message}
                  </p>
                )}

              {matches && matches.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {Array.from(matchesByRound.entries()).map(
                    ([round, roundMatches]) => (
                      <div
                        key={round}
                        className="border rounded-lg overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          onClick={() => toggleRound(round)}
                        >
                          <span className="font-medium text-gray-700 text-sm">
                            {round} ({roundMatches.length})
                          </span>
                          <ChevronDown
                            size={16}
                            className={cn(
                              "text-gray-500 transition-transform duration-200",
                              openRound === round && "rotate-180",
                            )}
                          />
                        </button>

                        {openRound === round && (
                          <div className="flex flex-col divide-y">
                            {roundMatches.map((match) => (
                              <button
                                key={match.id}
                                type="button"
                                className="w-full flex flex-col px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left gap-2"
                                onClick={() => setSelectedMatch(match)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {match.round_id}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatDateTime(
                                      match.start_time || match.start_date,
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 flex flex-col items-end">
                                    <span className="text-sm font-medium text-gray-800">
                                      {getTeamName(match.home_id)}
                                    </span>
                                    {getCompanyName(match.home_id) && (
                                      <span className="text-xs text-gray-400">
                                        {getCompanyName(match.home_id)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm font-bold text-gray-500 px-2">
                                    {match.home_score ?? "-"} :{" "}
                                    {match.away_score ?? "-"}
                                  </span>
                                  <div className="flex-1 flex flex-col">
                                    <span className="text-sm font-medium text-gray-800">
                                      {getTeamName(match.away_id)}
                                    </span>
                                    {getCompanyName(match.away_id) && (
                                      <span className="text-xs text-gray-400">
                                        {getCompanyName(match.away_id)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <span
                                    className={cn(
                                      "text-xs px-2 py-0.5 rounded-full font-medium",
                                      match.state === "DONE"
                                        ? "bg-green-100 text-green-700"
                                        : match.state === "LIVE"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-700",
                                    )}
                                  >
                                    {match.state}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8 border border-dashed rounded-xl text-sm">
                  No matches yet. Generate matches to get started.
                </div>
              )}
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

      {/* Edit Team Dialog */}
      <Dialog
        open={!!selectedTeam}
        onOpenChange={(open) => !open && setSelectedTeam(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <Form className="flex flex-col gap-5 pt-2" method="POST">
            <input type="hidden" name="_action" value="update_team" />
            <input type="hidden" name="team_id" value={selectedTeam?.id ?? ""} />
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                type="text"
                id="edit-team-name"
                name="name"
                defaultValue={selectedTeam?.name ?? ""}
                placeholder="Enter team name"
                required
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="edit-company-name">Company Name</Label>
              <Input
                type="text"
                id="edit-company-name"
                name="company_name"
                defaultValue={selectedTeam?.company_name ?? ""}
                placeholder="Enter company name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedTeam(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting && currentAction === "update_team"}
              >
                {isSubmitting && currentAction === "update_team"
                  ? "Saving..."
                  : "Save"}
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

      {/* Edit Match Dialog */}
      <Dialog
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match — {selectedMatch?.round} - </DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <Form className="flex flex-col gap-5 pt-2" method="POST">
              <div>
                <p>Current round: {selectedMatch?.round_id}</p>
                <p>Next round: {selectedMatch?.next_round_id}</p>
              </div>
              <input type="hidden" name="_action" value="update_match" />
              <input type="hidden" name="match_id" value={selectedMatch.id} />

              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="home-team">Home Team</Label>
                  <select
                    id="home-team"
                    name="home_id"
                    defaultValue={selectedMatch.home_id ?? ""}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">TBD</option>
                    {teams?.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.company_name} - {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="away-team">Away Team</Label>
                  <select
                    id="away-team"
                    name="away_id"
                    defaultValue={selectedMatch.away_id ?? ""}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">TBD</option>
                    {teams?.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.company_name} - {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="home-score">Home Score</Label>
                  <Input
                    type="number"
                    id="home-score"
                    name="home_score"
                    defaultValue={selectedMatch.home_score ?? ""}
                    min={0}
                    placeholder="—"
                  />
                </div>

                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="away-score">Away Score</Label>
                  <Input
                    type="number"
                    id="away-score"
                    name="away_score"
                    defaultValue={selectedMatch.away_score ?? ""}
                    min={0}
                    placeholder="—"
                  />
                </div>
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  type="datetime-local"
                  id="start-time"
                  name="start_time"
                  defaultValue={
                    selectedMatch.start_time
                      ? new Date(selectedMatch.start_time)
                          .toISOString()
                          .slice(0, 16)
                      : selectedMatch.start_date
                        ? new Date(selectedMatch.start_date)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                  }
                />
              </div>

              {actionData &&
                !actionData.success &&
                actionData._action === "update_match" && (
                  <p className="text-red-500 text-sm">{actionData.message}</p>
                )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedMatch(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting && currentAction === "update_match"}
                >
                  {isSubmitting && currentAction === "update_match"
                    ? "Saving..."
                    : "Save"}
                </Button>
              </div>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SportDetail;
