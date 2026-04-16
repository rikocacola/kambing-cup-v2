import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { getSession } from "~/sessions.server";
import { Button } from "~/lib/components/ui/button";
import { getUserService } from "~/lib/services/user/getUserService";
import { getActiveTournament } from "~/lib/services/tournaments/getActiveTournament";
import { subscribeSportsByTournament } from "~/lib/firebase/tournament-service";

export async function loader({ request }: { request: Request }) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  const activeTournament = await getActiveTournament();
  const tournamentSlug = activeTournament.success
    ? activeTournament.data?.slug
    : null;

  if (!token) return { isLoggedIn: false, isAdmin: false, tournamentSlug };

  const userInfo = await getUserService({ token });
  const isAdmin = userInfo.success && userInfo.data?.role === "admin";

  return { isLoggedIn: true, isAdmin, tournamentSlug };
}

const LiveMatch = ({
  loaderData,
}: {
  loaderData: {
    isLoggedIn: boolean;
    isAdmin: boolean;
    tournamentSlug: string | null;
  };
}) => {
  const { isLoggedIn, tournamentSlug } = loaderData;
  const navigate = useNavigate();
  const [sports, setSports] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = subscribeSportsByTournament(
      tournamentSlug,
      (sportsData) => {
        setSports(sportsData);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [tournamentSlug]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">Amaliah Cup</span>
          {!isLoggedIn ? (
            <Button size="sm" onClick={() => navigate("/login")}>
              Login
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          )}
        </div>
      </header>
      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <button
          onClick={() => navigate("/hafalan")}
          className="w-full mb-6 bg-white rounded-xl shadow-md p-4 flex items-center justify-center text-center font-semibold text-gray-800 hover:shadow-lg hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          Hafalan
        </button>
        <h1 className="text-2xl font-bold mb-6">Live Matches</h1>
        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading sports...</p>
        ) : sports.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No sports available</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => navigate(`/live-match/${sport.id}`)}
                className="bg-white rounded-xl shadow-md p-6 flex items-center justify-center text-center font-semibold text-gray-800 hover:shadow-lg hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                {sport.name.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveMatch;
