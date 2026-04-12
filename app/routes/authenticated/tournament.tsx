import { useNavigate } from "react-router";
import { getAllTournaments } from "~/lib/services/tournaments/getAllTournaments";
import type { IResponseDataTournament } from "~/lib/services/tournaments/getAllTournaments";
import { getAllSports } from "~/lib/services/sports/getAllSports";
import type { IResponseDataSport } from "~/lib/services/sports/getAllSports";
import type { Route } from "./+types/tournament";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tournament" }];
}

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token) return { tournament: null, sports: [] };

  const tournamentsRes = await getAllTournaments({ token });
  const tournaments = tournamentsRes.success
    ? (tournamentsRes.data as IResponseDataTournament[])
    : [];

  const activeTournament = tournaments.find((t) => t.is_active) ?? null;

  if (!activeTournament) {
    return { tournament: null, sports: [] };
  }

  const sportsRes = await getAllSports({
    token,
    tournamentId: String(activeTournament.id),
  });

  return {
    tournament: activeTournament,
    sports: sportsRes.success ? (sportsRes.data as IResponseDataSport[]) : [],
  };
}

const Tournament = ({ loaderData }: Route.ComponentProps) => {
  const { tournament, sports } = loaderData;
  const navigate = useNavigate();

  if (!tournament) {
    return (
      <div className="text-center text-gray-500 py-16">
        No active tournament at the moment.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{tournament.name}</h1>
      <img
        src={tournament.image_url}
        alt={tournament.name}
        className="w-full h-64 object-cover rounded-lg mb-8 mt-4"
      />

      <h2 className="text-lg font-semibold mb-4">Sports</h2>

      {sports && sports.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sports.map((sport: IResponseDataSport) => (
            <div
              key={sport.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() =>
                navigate(
                  `/dashboard/tournaments/${tournament.id}/sports/${sport.id}`,
                )
              }
            >
              <img
                src={sport.image_url}
                alt={sport.name}
                className="w-14 h-14 object-cover rounded-lg shrink-0"
              />
              <span className="flex-1 font-medium text-gray-800">
                {sport.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-10 border border-dashed rounded-xl">
          No sports yet for this tournament.
        </div>
      )}
    </div>
  );
};

export default Tournament;
