import { useNavigate } from "react-router";
import { getSession } from "~/sessions.server";
import { Button } from "~/lib/components/ui/button";
import { getUserService } from "~/lib/services/user/getUserService";

export async function loader({ request }: { request: Request }) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  if (!token) return { isLoggedIn: false, isAdmin: false };

  const userInfo = await getUserService({ token });
  const isAdmin = userInfo.success && userInfo.data?.role === "admin";

  return { isLoggedIn: true, isAdmin };
}

const SPORTS = [
  { id: "fifa", label: "FIFA" },
  { id: "futsal", label: "Futsal" },
  { id: "tepuk-bulu", label: "Tepuk Bulu" },
  { id: "archery", label: "Archery" },
  { id: "ping-pong", label: "Ping Pong" },
];

const LiveMatch = ({
  loaderData,
}: {
  loaderData: { isLoggedIn: boolean; isAdmin: boolean };
}) => {
  const { isLoggedIn, isAdmin } = loaderData;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">Kambing Cup</span>
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
        <h1 className="text-2xl font-bold mb-6">Live Matches</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => navigate(`/live-match/${sport.id}`)}
              className="bg-white rounded-xl shadow-md p-6 flex items-center justify-center text-center font-semibold text-gray-800 hover:shadow-lg hover:bg-primary hover:text-white transition-all cursor-pointer"
            >
              {sport.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LiveMatch;
