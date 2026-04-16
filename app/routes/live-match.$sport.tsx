import { useNavigate } from "react-router";
import { getSession } from "~/sessions.server";
import { Button } from "~/lib/components/ui/button";

const SPORT_LABELS: Record<string, string> = {
  fifa: "FIFA",
  futsal: "Futsal",
  "tepuk-bulu": "Tepuk Bulu",
  archery: "Archery",
  "ping-pong": "Ping Pong",
};

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

  // TODO: replace with real API call using `sport` param
  const allMatches = [
    { id: "1", sport: "fifa", homeTeam: "Team Alpha", awayTeam: "Team Beta", homeScore: 2, awayScore: 1, status: "Live", stage: "Semifinal" },
    { id: "2", sport: "fifa", homeTeam: "Team Gamma", awayTeam: "Team Delta", homeScore: 0, awayScore: 0, status: "Finished", stage: "Quarter Final" },
    { id: "3", sport: "futsal", homeTeam: "Team Epsilon", awayTeam: "Team Zeta", homeScore: 3, awayScore: 2, status: "Live", stage: "Final" },
    { id: "4", sport: "futsal", homeTeam: "Team Eta", awayTeam: "Team Theta", homeScore: 1, awayScore: 1, status: "Live", stage: "Semifinal" },
    { id: "5", sport: "tepuk-bulu", homeTeam: "Team Iota", awayTeam: "Team Kappa", homeScore: 0, awayScore: 2, status: "Finished", stage: "Group Stage" },
    { id: "6", sport: "tepuk-bulu", homeTeam: "Team Lambda", awayTeam: "Team Mu", homeScore: 1, awayScore: 0, status: "Live", stage: "Quarter Final" },
    { id: "7", sport: "archery", homeTeam: "Team Nu", awayTeam: "Team Xi", homeScore: 5, awayScore: 4, status: "Live", stage: "Final" },
    { id: "8", sport: "ping-pong", homeTeam: "Team Omicron", awayTeam: "Team Pi", homeScore: 2, awayScore: 3, status: "Finished", stage: "Semifinal" },
  ];

  const matches = allMatches.filter((m) => m.sport === sport);

  return { matches, isLoggedIn, sport };
}

type Match = {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  stage: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  const isLive = status === "Live";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isLive ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
      }`}
    >
      {isLive && (
        <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
      )}
      {status}
    </span>
  );
};

const LiveMatchSport = ({
  loaderData,
}: {
  loaderData: { matches: Match[]; isLoggedIn: boolean; sport: string };
}) => {
  const { matches, isLoggedIn, sport } = loaderData;
  const navigate = useNavigate();
  const sportLabel = SPORT_LABELS[sport] ?? sport;

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

        {matches.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No matches available</p>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-xl shadow-md p-4 sm:p-5 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <StatusBadge status={match.status} />
                  <span className="text-xs font-medium text-gray-500">{match.stage}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-center">
                    <p className="text-sm sm:text-base font-semibold text-gray-800">
                      {match.homeTeam}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {match.homeScore}
                    </span>
                    <span className="text-lg text-gray-400 font-light">—</span>
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {match.awayScore}
                    </span>
                  </div>

                  <div className="flex-1 text-center">
                    <p className="text-sm sm:text-base font-semibold text-gray-800">
                      {match.awayTeam}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveMatchSport;
