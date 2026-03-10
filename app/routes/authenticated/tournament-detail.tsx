import { getSession } from "~/sessions.server";
import { getTournament } from "~/lib/services/tournaments/getTournament";
import type { Route } from "./+types/tournament-detail";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tournament Detail" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  if (!token) return { tournament: null };

  const response = await getTournament({ token, id: params.id });
  return { tournament: response.success ? response.data : null };
}

const TournamentDetail = ({ loaderData }: Route.ComponentProps) => {
  const { tournament } = loaderData;

  if (!tournament) {
    return (
      <div className="text-center text-gray-500 py-8">Tournament not found</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{tournament.name}</h1>
      <img
        src={tournament.image_url}
        alt={tournament.name}
        className="w-full h-64 object-cover rounded-lg mb-6"
      />
    </div>
  );
};

export default TournamentDetail;
