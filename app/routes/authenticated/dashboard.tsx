import { useState } from "react";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/dashboard";
import { getAllTournaments } from "~/lib/services/tournaments/getAllTournaments";
import { createTournament } from "~/lib/services/tournaments/createTournament";
import { updateTournament } from "~/lib/services/tournaments/updateTournament";
import { deleteTournament } from "~/lib/services/tournaments/deleteTournament";
import DialogForm from "~/lib/components/tournaments/dialog-form";
import TournamentDetailDialog from "~/lib/components/tournaments/tournament-detail-dialog";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kambing Cup Dashboard" },
    { name: "description", content: "Welcome to Kambing Cup" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  if (token) {
    const response = await getAllTournaments({ token });
    return { tournaments: response };
  }
  return { tournaments: null };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  const formData = await request.formData();
  const action = formData.get("_action") as string;

  if (!token) {
    return { success: false, error: "Unauthorized" };
  }

  if (action === "update") {
    const tournamentId = formData.get("tournamentId") as string;
    const name = formData.get("name") as string;
    const image = formData.get("image") as File;

    const body: { name: string; image?: File } = { name };
    if (image && image.size > 0) {
      body.image = image;
    }

    const response = await updateTournament({ token, id: tournamentId, body });
    return response;
  }

  if (action === "delete") {
    const tournamentId = formData.get("tournamentId") as string;
    const response = await deleteTournament({ token, id: tournamentId });
    return response;
  }

  // Default: create tournament
  const name = formData.get("name") as string;
  const image = formData.get("image") as File;
  const response = await createTournament({ token, body: { name, image } });
  return response;
}

type Tournament = {
  id: string;
  name: string;
  image_url: string;
};

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
  const tournaments = loaderData.tournaments;
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTournamentClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex w-full justify-between">
        <h1>Dashboard</h1>
        <DialogForm />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {tournaments?.data && tournaments?.data.length > 0 ? (
          tournaments?.data.map((tournament: Tournament) => (
            <div
              key={tournament.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleTournamentClick(tournament)}
            >
              <img
                src={tournament.image_url}
                alt={tournament.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">{tournament.name}</h3>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            No tournaments available
          </div>
        )}
      </div>
      <TournamentDetailDialog
        tournament={selectedTournament}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Dashboard;
