import { useEffect, useRef, useState } from "react";
import { useParams, useRevalidator } from "react-router";
import { ref, onValue, off } from "firebase/database";
import { db } from "~/lib/firebase/firebase";
import { toast } from "sonner";
import { ChevronDown, X } from "lucide-react";
import { getSport } from "~/lib/services/sports/getSport";
import type { IResponseDataSportDetail } from "~/lib/services/sports/getSport";
import { getAllTeams } from "~/lib/services/teams/getAllTeams";
import type { IResponseDataTeam } from "~/lib/services/teams/getAllTeams";
import { updateTeam } from "~/lib/services/teams/updateTeam";
import { updateMatch } from "~/lib/services/matches/updateMatch";
import { getMatchHistory } from "~/lib/services/matches/getMatchHistory";
import type { IMatchHistoryImage } from "~/lib/services/matches/getMatchHistory";
import { getSportTeamHistory } from "~/lib/services/sports/getSportTeamHistory";
import { Button } from "~/lib/components/ui/button";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import { ImageCarousel } from "~/lib/components/image-carousel";
import { cn } from "~/lib/utils";
import { resizeImageUnder2MB } from "~/lib/utils/resizeImage";
import { BASE_URL } from "~/lib/services/auth/loginService";
import type { Route } from "./+types/admin-sport-detail";

interface IFirebaseParticipant {
  canEditTeams: boolean;
  isWinner: boolean;
  name: string;
  teams_id?: string;
  resultText?: string;
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
  matchId: number;
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
  const [selectedTeam, setSelectedTeam] = useState<IResponseDataTeam | null>(
    null,
  );
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<IFirebaseMatch | null>(
    null,
  );
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [matchFormData, setMatchFormData] = useState<{
    image?: File;
    sets: Array<{ home: string; away: string }>;
  }>({ sets: [{ home: "", away: "" }] });
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [showImageCarousel, setShowImageCarousel] = useState(false);
  const [historyImages, setHistoryImages] = useState<IMatchHistoryImage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [carouselTitle, setCarouselTitle] = useState("");
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

  useEffect(() => {
    if (!selectedMatch || selectedMatch.state !== "LIVE") return;

    const homeText = selectedMatch.participants[0]?.resultText ?? "";
    const awayText = selectedMatch.participants[1]?.resultText ?? "";

    if (homeText && homeText !== "0" && homeText.includes("|")) {
      const homeParts = homeText.split("|");
      const awayParts = awayText.split("|");
      setMatchFormData((prev) => ({
        ...prev,
        sets: homeParts.map((h, i) => ({ home: h, away: awayParts[i] ?? "" })),
      }));
    } else {
      setMatchFormData((prev) => ({
        ...prev,
        sets: [
          {
            home: homeText && homeText !== "0" ? homeText : "",
            away: awayText && awayText !== "0" ? awayText : "",
          },
        ],
      }));
    }
  }, [selectedMatch]);

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
    if (!selectedMatch) return;

    // Validate required fields for SOON state
    if (selectedMatch.state === "SOON" && !matchFormData.image) {
      toast.error("Image is required to start the match!");
      return;
    }

    setIsSavingMatch(true);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const body: Parameters<typeof updateMatch>[0]["body"] = {
        home_id: null,
        away_id: null,
        home_score: null,
        away_score: null,
        state: selectedMatch.state as "SOON" | "LIVE" | "DONE",
        sport_id: sport.id,
      };

      console.log("selectedMatch", selectedMatch);

      // Handle SOON -> LIVE transition
      if (selectedMatch.state === "SOON") {
        body.state = "LIVE";
        if (matchFormData.image) {
          // Resize image to 2MB max and convert back to File
          const resizedBase64 = await resizeImageUnder2MB(matchFormData.image);
          const response = await fetch(resizedBase64);
          const blob = await response.blob();
          const resizedFile = new File([blob], matchFormData.image.name, {
            type: "image/jpeg",
          });
          body.image = resizedFile;
        }
      }

      // Handle LIVE state score updates
      if (selectedMatch.state === "LIVE") {
        body.home_score = matchFormData.sets
          .map((s) => s.home || "0")
          .join("|");
        body.away_score = matchFormData.sets
          .map((s) => s.away || "0")
          .join("|");
      }

      const res = await updateMatch({
        token,
        id: selectedMatch.matchId,
        body,
      });

      if (res.success) {
        toast.success("Match updated!");
        setSelectedMatch(null);
        setMatchFormData({ sets: [{ home: "", away: "" }] });
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error("Error saving match:", error);
      toast.error("Failed to update match.");
    } finally {
      setIsSavingMatch(false);
    }
  };

  const handleFinishMatch = () => {
    setShowWinnerDialog(true);
  };

  const handleSelectWinner = async (winnerId: string) => {
    if (!selectedMatch) return;

    setIsSavingMatch(true);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const res = await updateMatch({
        token,
        id: selectedMatch.matchId,
        body: {
          home_id: null,
          away_id: null,
          home_score: matchFormData.sets.map((s) => s.home || "0").join("|"),
          away_score: matchFormData.sets.map((s) => s.away || "0").join("|"),
          state: "DONE",
          winner_id: winnerId,
        },
      });

      if (res.success) {
        toast.success("Match finished!");
        setSelectedMatch(null);
        setShowWinnerDialog(false);
        setMatchFormData({ sets: [{ home: "", away: "" }] });
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error("Error finishing match:", error);
      toast.error("Failed to finish match.");
    } finally {
      setIsSavingMatch(false);
    }
  };

  const handleMatchImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMatchFormData((prev) => ({ ...prev, image: file }));
  };

  const addSet = () => {
    setMatchFormData((prev) => ({
      ...prev,
      sets: [...prev.sets, { home: "", away: "" }],
    }));
  };

  const removeSet = (index: number) => {
    setMatchFormData((prev) => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index),
    }));
  };

  const updateSet = (index: number, field: "home" | "away", value: string) => {
    setMatchFormData((prev) => ({
      ...prev,
      sets: prev.sets.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const isThirdPlaceMatch = (match: IFirebaseMatch) =>
    match._key === "2" || match.tournamentRoundText === "Perebutan juara 3";

  const handleShowImages = async (teamIndex: 0 | 1) => {
    if (!selectedMatch) return;

    const team = selectedMatch.participants[teamIndex];
    if (!team?.teams_id) {
      toast.error("Team ID not available");
      return;
    }

    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      console.log("selectedMatch", selectedMatch);
      const res = isThirdPlaceMatch(selectedMatch)
        ? await getSportTeamHistory({
            token,
            sportId: sport.id,
            teamId: team.teams_id,
          })
        : await getMatchHistory({
            token,
            matchId: selectedMatch.matchId,
            teamId: team.teams_id,
          });

      if (res.success && res.data?.data) {
        setHistoryImages(res.data.data);
        setCarouselTitle(team.name);
        setShowImageCarousel(true);
      } else {
        toast.error(res.message || "Failed to load images");
      }
    } catch (error) {
      console.error("Error loading images:", error);
      toast.error("Failed to load images");
    } finally {
      setIsLoadingHistory(false);
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
                                className="w-full flex items-center px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left flex-col"
                                onClick={() => setSelectedMatch(match)}
                              >

                                <span
                                  className={cn(
                                    "ml-4 text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                                    match.state === "DONE"
                                      ? "bg-green-100 text-green-700"
                                      : match.state === "LIVE"
                                        ? "bg-red-200 text-red-700"
                                        : "bg-yellow-100 text-yellow-700",
                                  )}
                                >
                                  {match.state}
                                </span>
                                <div className="flex-1 flex items-center justify-between gap-4">
                                  <span className="bg-blue-300 text-blue-800 px-2 text-sm rounded-4xl">
                                    {match.participants[0]?.resultText ?? "0"}
                                  </span>
                                  <span className="text-sm font-medium text-gray-800 flex-1 text-right">
                                    {match.participants[0]?.name ?? "TBD"}
                                  </span>
                                  <span className="text-sm font-bold text-gray-400 px-2">
                                    vs
                                  </span>
                                  <span className="text-sm font-medium text-gray-800 flex-1 flex gap-2">
                                    {match.participants[1]?.name ?? "TBD"}
                                  </span>
                                  <span className="bg-blue-300 text-blue-800 px-2 text-sm rounded-4xl">
                                    {match.participants[1]?.resultText ?? "0"}
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
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMatch(null);
            setMatchFormData({ sets: [{ home: "", away: "" }] });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMatch?.name ?? "Match"}</DialogTitle>
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

              <div className="flex items-center justify-between gap-4 py-2">
                <Button
                  type="button"
                  onClick={() => handleShowImages(0)}
                  disabled={isLoadingHistory}
                  className="text-xs"
                >
                  {isLoadingHistory ? "Loading..." : "Show Images (Home Team)"}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleShowImages(1)}
                  disabled={isLoadingHistory}
                  className="text-xs"
                >
                  {isLoadingHistory ? "Loading..." : "Show Images (Away Team)"}
                </Button>
              </div>

              {/* DONE — read-only */}
              {selectedMatch.state === "DONE" && (
                <div className="flex flex-col gap-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Home Score</Label>
                      <Input
                        value={
                          selectedMatch.participants?.[0]?.resultText ?? "0"
                        }
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Away Score</Label>
                      <Input
                        value={
                          selectedMatch.participants?.[1]?.resultText ?? "0"
                        }
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>State</Label>
                    <Input
                      value={selectedMatch.state}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  {selectedMatch.image && (
                    <img
                      src={selectedMatch.image}
                      alt="match"
                      className="w-full rounded-lg object-cover max-h-40"
                    />
                  )}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMatch(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}

              {/* SOON — image upload to start match */}
              {selectedMatch.state === "SOON" && (
                <form
                  onSubmit={handleSaveMatch}
                  className="flex flex-col gap-4 pt-1"
                >
                  <div className="grid gap-1.5">
                    <Label>
                      Match Image <span className="text-red-600">*</span>
                    </Label>
                    <input
                      ref={matchImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleMatchImageUpload}
                    />
                    {matchFormData.image && (
                      <>
                        <img
                          src={URL.createObjectURL(matchFormData.image)}
                          alt="match"
                          className="w-full rounded-lg object-cover max-h-40 mb-1"
                        />
                        <p className="text-sm text-gray-600">
                          {matchFormData.image.name}
                        </p>
                      </>
                    )}
                    {selectedMatch.image && !matchFormData.image && (
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
                      {matchFormData.image ? "Change Image" : "Select Image"}
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedMatch(null);
                        setMatchFormData({ sets: [{ home: "", away: "" }] });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSavingMatch}>
                      {isSavingMatch ? "Starting..." : "Start Match"}
                    </Button>
                  </div>
                </form>
              )}

              {/* LIVE — edit scores + finish */}
              {selectedMatch.state === "LIVE" && (
                <form
                  onSubmit={handleSaveMatch}
                  className="flex flex-col gap-4 pt-1"
                >
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-[3rem_1fr_1fr_1.5rem] items-center gap-2">
                      <span />
                      <Label className="text-center text-xs text-gray-500">
                        Home
                      </Label>
                      <Label className="text-center text-xs text-gray-500">
                        Away
                      </Label>
                      <span />
                    </div>

                    {matchFormData.sets.map((set, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[3rem_1fr_1fr_1.5rem] items-center gap-2"
                      >
                        <span className="text-xs text-gray-500 text-right pr-1">
                          Set {index + 1}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={set.home}
                          onChange={(e) =>
                            updateSet(index, "home", e.target.value)
                          }
                          placeholder="0"
                          className="text-center"
                        />
                        <Input
                          type="number"
                          min={0}
                          value={set.away}
                          onChange={(e) =>
                            updateSet(index, "away", e.target.value)
                          }
                          placeholder="0"
                          className="text-center"
                        />
                        {matchFormData.sets.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeSet(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                    ))}

                    {matchFormData.sets.length < 3 && (
                      <button
                        type="button"
                        onClick={addSet}
                        className="mt-1 w-full border border-dashed border-gray-300 rounded-md py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                      >
                        + Add Set
                      </button>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedMatch(null);
                        setMatchFormData({ sets: [{ home: "", away: "" }] });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSavingMatch}>
                      {isSavingMatch ? "Saving..." : "Save Score"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isSavingMatch}
                      onClick={handleFinishMatch}
                    >
                      Finish Match
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Winner Selection Dialog */}
      <Dialog
        open={showWinnerDialog}
        onOpenChange={(open) => !open && setShowWinnerDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Winner</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="flex flex-col gap-3 pt-2">
              <p className="text-sm text-gray-600">
                Select the winner for this match:
              </p>
              <div className="flex flex-col gap-2">
                {selectedMatch.participants.map((team, idx) => {
                  const scoreKey = idx === 0 ? "home" : "away";
                  const scores = matchFormData.sets
                    .map((s) => s[scoreKey] || "0")
                    .join(" | ");
                  return (
                    <Button
                      key={idx}
                      onClick={() => {
                        if (team) handleSelectWinner(team?.teams_id || "");
                      }}
                      disabled={isSavingMatch}
                      variant="outline"
                      className="h-12 justify-between px-4"
                    >
                      <span className="font-semibold">{team?.name || "TBD"}</span>
                      <span className="text-sm text-gray-500 font-mono">
                        {scores}
                      </span>
                    </Button>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowWinnerDialog(false)}
                disabled={isSavingMatch}
              >
                Cancel
              </Button>
            </div>
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

      {/* Image Carousel Dialog */}
      <Dialog
        open={showImageCarousel}
        onOpenChange={(open) => {
          if (!open) {
            setShowImageCarousel(false);
            setHistoryImages([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{carouselTitle} - Match Images</DialogTitle>
          </DialogHeader>
          <ImageCarousel
            images={historyImages}
            onClose={() => setShowImageCarousel(false)}
            title={carouselTitle}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSportDetail;
