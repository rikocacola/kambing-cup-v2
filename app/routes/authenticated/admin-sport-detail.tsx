import { useEffect, useRef, useState } from "react";
import { useParams, useRevalidator } from "react-router";
import { ref, onValue, off, update } from "firebase/database";
import { db } from "~/lib/firebase/firebase";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { getSport } from "~/lib/services/sports/getSport";
import type { IResponseDataSportDetail } from "~/lib/services/sports/getSport";
import { getAllTeams } from "~/lib/services/teams/getAllTeams";
import type { IResponseDataTeam } from "~/lib/services/teams/getAllTeams";
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
import { resizeImageUnder2MB } from "~/lib/utils/resizeImage";
import { BASE_URL } from "~/lib/services/auth/loginService";
import type { Route } from "./+types/admin-sport-detail";

interface IFirebaseParticipant {
  canEditTeams: boolean;
  isWinner: boolean;
  name: string;
}

interface IFirebaseMatch {
  _key: string;
  name: string;
  nextMatchId: string;
  participants: IFirebaseParticipant[];
  startTime: string;
  state: string;
  tournamentRoundText: string;
  homeScore?: number;
  awayScore?: number;
  image?: string;
}

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
    sport: sportRes.success
      ? (sportRes.data as IResponseDataSportDetail).data
      : null,
    teams: teamsRes.success ? (teamsRes.data?.data as IResponseDataTeam[]) : [],
  };
}

function groupMatchesByRound(
  matches: IFirebaseMatch[],
): Map<string, IFirebaseMatch[]> {
  const map = new Map<string, IFirebaseMatch[]>();
  for (const match of matches) {
    const existing = map.get(match.tournamentRoundText) ?? [];
    existing.push(match);
    map.set(match.tournamentRoundText, existing);
  }
  return map;
}

const AdminSportDetail = ({ loaderData }: Route.ComponentProps) => {
  const { sport, teams } = loaderData;
  const { slug } = useParams<{ slug: string }>();
  const { revalidate } = useRevalidator();

  const [matches, setMatches] = useState<IFirebaseMatch[]>([]);
  const [openAccordion, setOpenAccordion] = useState<
    "teams" | "matches" | null
  >("teams");
  const [openRound, setOpenRound] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<IResponseDataTeam | null>(null);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<IFirebaseMatch | null>(null);
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const matchImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug || !sport?.slug) return;

    const dbRef = ref(db, `${slug}/sports/${sport.slug}`);

    onValue(dbRef, (snapshot) => {
      const val = snapshot.val()?.matches;
      if (!val) {
        setMatches([]);
        return;
      }

      const entries = Array.isArray(val)
        ? val.map((m, i) => [String(i), m] as [string, IFirebaseMatch])
        : (Object.entries(val) as [string, IFirebaseMatch][]);

      const mapped = entries.map(([key, match]) => ({
        ...match,
        _key: key,
        participants: (match.participants ?? []).filter(
          (p): p is IFirebaseParticipant => p !== null && p !== undefined,
        ),
      }));

      setMatches(mapped);
    });

    return () => {
      off(dbRef);
    };
  }, [slug, sport?.slug]);

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

  const matchesByRound = groupMatchesByRound(matches);

  const handleTeamImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTeam) return;

    setIsUpdatingTeam(true);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const res = await updateTeam({
        token,
        id: selectedTeam.id,
        body: { image: file },
      });

      if (res.success) {
        toast.success("Team image updated successfully!");
        setSelectedTeam(null);
        revalidate();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setIsUpdatingTeam(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleSaveMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMatch || !slug || !sport?.slug) return;

    setIsSavingMatch(true);
    try {
      const form = new FormData(e.currentTarget);
      const updates: Record<string, unknown> = {};

      const newState = form.get("state") as string;
      if (newState) updates.state = newState;

      if (selectedMatch.state === "LIVE") {
        const home = form.get("homeScore") as string;
        const away = form.get("awayScore") as string;
        if (home !== "") updates.homeScore = Number(home);
        if (away !== "") updates.awayScore = Number(away);
      }

      const matchRef = ref(
        db,
        `${slug}/sports/${sport.slug}/matches/${selectedMatch._key}`,
      );
      await update(matchRef, updates);
      toast.success("Match updated!");
      setSelectedMatch(null);
    } catch {
      toast.error("Failed to update match.");
    } finally {
      setIsSavingMatch(false);
    }
  };

  const handleMatchImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMatch || !slug || !sport?.slug) return;

    setIsSavingMatch(true);
    try {
      const base64 = await resizeImageUnder2MB(file);
      const matchRef = ref(
        db,
        `${slug}/sports/${sport.slug}/matches/${selectedMatch._key}`,
      );
      await update(matchRef, { image: base64 });
      toast.success("Match image updated!");
      setSelectedMatch((prev) => (prev ? { ...prev, image: base64 } : null));
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setIsSavingMatch(false);
      if (matchImageInputRef.current) matchImageInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
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
              {teams && teams.length > 0 ? (
                <div className="flex flex-col gap-2 pt-4">
                  {teams.map((team: IResponseDataTeam) => (
                    <button
                      key={team.id}
                      type="button"
                      className="bg-gray-50 rounded-lg border border-gray-100 flex items-center px-4 py-3 hover:bg-gray-100 transition-colors text-left w-full"
                      onClick={() => setSelectedTeam(team)}
                    >
                      <span className="flex-1 font-medium text-gray-800 text-sm">
                        {team.name}
                      </span>
                      {team.company_name && (
                        <span className="text-xs text-gray-400">
                          {team.company_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8 border border-dashed rounded-xl text-sm mt-4">
                  No teams yet.
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
              Matches {matches.length > 0 ? `(${matches.length})` : ""}
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
            <div className="px-5 pb-5 bg-white border-t pt-4">
              {matches.length > 0 ? (
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
                            {roundMatches.map((match, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="w-full flex items-center px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
                                onClick={() => setSelectedMatch(match)}
                              >
                                <div className="flex-1 flex items-center justify-between gap-4">
                                  <span className="text-sm font-medium text-gray-800 flex-1 text-right">
                                    {match.participants[0]?.name ?? "TBD"}
                                  </span>
                                  <span className="text-sm font-bold text-gray-400 px-2">
                                    vs
                                  </span>
                                  <span className="text-sm font-medium text-gray-800 flex-1">
                                    {match.participants[1]?.name ?? "TBD"}
                                  </span>
                                </div>
                                <span
                                  className={cn(
                                    "ml-4 text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                                    match.state === "DONE"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700",
                                  )}
                                >
                                  {match.state}
                                </span>
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
                  No matches yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Match Dialog */}
      <Dialog
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMatch?.name ?? "Match"}
            </DialogTitle>
          </DialogHeader>

          {selectedMatch && (
            <>
              {/* Participants display (always shown) */}
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm font-medium text-gray-800 flex-1 text-right">
                  {selectedMatch.participants[0]?.name ?? "TBD"}
                </span>
                <span className="text-xs font-bold text-gray-400 px-2">vs</span>
                <span className="text-sm font-medium text-gray-800 flex-1">
                  {selectedMatch.participants[1]?.name ?? "TBD"}
                </span>
              </div>

              {/* DONE — read-only */}
              {selectedMatch.state === "DONE" && (
                <div className="flex flex-col gap-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Home Score</Label>
                      <Input value={selectedMatch.homeScore ?? "-"} disabled className="bg-gray-50" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Away Score</Label>
                      <Input value={selectedMatch.awayScore ?? "-"} disabled className="bg-gray-50" />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>State</Label>
                    <Input value={selectedMatch.state} disabled className="bg-gray-50" />
                  </div>
                  {selectedMatch.image && (
                    <img
                      src={selectedMatch.image}
                      alt="match"
                      className="w-full rounded-lg object-cover max-h-40"
                    />
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setSelectedMatch(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}

              {/* SOON — state change + image upload */}
              {selectedMatch.state === "SOON" && (
                <form onSubmit={handleSaveMatch} className="flex flex-col gap-4 pt-1">
                  <div className="grid gap-1.5">
                    <Label htmlFor="match-state-soon">State</Label>
                    <select
                      id="match-state-soon"
                      name="state"
                      defaultValue={selectedMatch.state}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="SOON">SOON</option>
                      <option value="LIVE">LIVE</option>
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Image</Label>
                    <input
                      ref={matchImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleMatchImageUpload}
                    />
                    {selectedMatch.image && (
                      <img
                        src={selectedMatch.image}
                        alt="match"
                        className="w-full rounded-lg object-cover max-h-32 mb-1"
                      />
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSavingMatch}
                      onClick={() => matchImageInputRef.current?.click()}
                    >
                      {isSavingMatch ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedMatch(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSavingMatch}>
                      {isSavingMatch ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              )}

              {/* LIVE — edit scores + state */}
              {selectedMatch.state === "LIVE" && (
                <form onSubmit={handleSaveMatch} className="flex flex-col gap-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="home-score">Home Score</Label>
                      <Input
                        id="home-score"
                        name="homeScore"
                        type="number"
                        min={0}
                        defaultValue={selectedMatch.homeScore ?? ""}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="away-score">Away Score</Label>
                      <Input
                        id="away-score"
                        name="awayScore"
                        type="number"
                        min={0}
                        defaultValue={selectedMatch.awayScore ?? ""}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="match-state-live">State</Label>
                    <select
                      id="match-state-live"
                      name="state"
                      defaultValue={selectedMatch.state}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="LIVE">LIVE</option>
                      <option value="DONE">DONE</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedMatch(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSavingMatch}>
                      {isSavingMatch ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Team Image Upload Dialog */}
      <Dialog
        open={!!selectedTeam}
        onOpenChange={(open) => !open && setSelectedTeam(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          {selectedTeam && (
            <div className="flex flex-col gap-5 pt-2">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  type="text"
                  value={selectedTeam.name}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="team-image">Photo / Logo</Label>
                <input
                  ref={imageInputRef}
                  id="team-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleTeamImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdatingTeam}
                  onClick={() => imageInputRef.current?.click()}
                >
                  {isUpdatingTeam ? "Uploading..." : "Choose Image"}
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTeam(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSportDetail;
