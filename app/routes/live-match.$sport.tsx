import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { getSession } from "~/sessions.server";
import { Button } from "~/lib/components/ui/button";
import { Accordion } from "~/lib/components/ui/accordion";
import { getActiveTournament } from "~/lib/services/tournaments/getActiveTournament";
import {
  getMatchesBySport,
  categorizeMatchesByRound,
  separateLiveMatches,
  type Match,
} from "~/lib/firebase/tournament-service";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { sport: string };
}) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  const isLoggedIn = !!token;
  const sport = params.sport;

  const activeTournament = await getActiveTournament();
  const tournamentSlug = activeTournament.success
    ? activeTournament.data?.slug
    : null;

  return { isLoggedIn, sport, tournamentSlug };
}

const StateBadge = ({ state }: { state: string }) => {
  const isLive = state === "LIVE";
  const colors: Record<string, string> = {
    LIVE: "bg-red-100 text-red-600",
    DONE: "bg-gray-100 text-gray-500",
    SOON: "bg-blue-100 text-blue-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        colors[state] || "bg-gray-100 text-gray-500"
      }`}
    >
      {isLive && (
        <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
      )}
      {state}
    </span>
  );
};

const MatchCard = ({ match }: { match: Match }) => {
  const homeTeam = match.participants[0];
  const awayTeam = match.participants[1];

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StateBadge state={match.state} />
        <span className="text-xs font-medium text-gray-500">
          {match.startTime}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-center">
          <p className="text-sm sm:text-base font-semibold text-gray-800">
            {homeTeam?.name || "TBD"}
          </p>
        </div>

        <div className="flex-1 text-center">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">{match.name}</p>
        </div>

        <div className="flex-1 text-center">
          <p className="text-sm sm:text-base font-semibold text-gray-800">
            {awayTeam?.name || "TBD"}
          </p>
        </div>
      </div>
    </div>
  );
};

const LiveMatchSport = ({
  loaderData,
}: {
  loaderData: {
    isLoggedIn: boolean;
    sport: string;
    tournamentSlug: string | null;
  };
}) => {
  const { isLoggedIn, sport, tournamentSlug } = loaderData;
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [categorizedMatches, setCategorizedMatches] = useState<
    Record<string, Match[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      if (!tournamentSlug) {
        setLoading(false);
        return;
      }

      try {
        const matchesData = await getMatchesBySport(tournamentSlug, sport);
        const { liveMatches: live, otherMatches } =
          separateLiveMatches(matchesData);

        setMatches(matchesData);
        console.log("matchesData", matchesData);
        setLiveMatches(live);

        const categorized = categorizeMatchesByRound(otherMatches);
        setCategorizedMatches(categorized);
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [tournamentSlug, sport]);

  const sportLabel = sport.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="font-bold text-lg hover:opacity-70 transition-opacity"
          >
            Amaliah Cup
          </button>
          {!isLoggedIn && (
            <Button size="sm" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-gray-500 hover:text-gray-800 mb-4 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-6">{sportLabel}</h1>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading matches...</p>
        ) : matches.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No matches available
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Live Matches Section */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-red-600">
                🔴 Live Matches
              </h2>
              <div className="flex flex-col gap-3">
                {liveMatches.length > 0 ? (
                  liveMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No live matches available
                  </p>
                )}
              </div>
            </div>

            {/* All Matches by Round */}
            {Object.entries(categorizedMatches).length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-gray-900">All Matches</h2>
                <Accordion
                  items={Object.entries(categorizedMatches)
                    .reverse()
                    .map(([roundText, roundMatches]) => ({
                      id: roundText,
                      title: (
                        <div className="flex items-center justify-between flex-1">
                          <span className="font-semibold text-gray-900">
                            {roundText}
                          </span>
                          <span className="text-sm text-gray-500">
                            {roundMatches.length} match
                            {roundMatches.length !== 1 ? "es" : ""}
                          </span>
                        </div>
                      ),
                      content: (
                        <div className="flex flex-col gap-3">
                          {roundMatches.map((match) => (
                            <MatchCard key={match.id} match={match} />
                          ))}
                        </div>
                      ),
                    }))}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveMatchSport;
