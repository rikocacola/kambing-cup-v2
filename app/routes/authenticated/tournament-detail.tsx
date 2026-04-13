import { useEffect, useRef, useState } from "react";
import { useActionData, useNavigation, useNavigate, Form } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import { getTournament } from "~/lib/services/tournaments/getTournament";
import {
  getAllSports,
  type IResponseDataSport,
} from "~/lib/services/sports/getAllSports";
import { createSport } from "~/lib/services/sports/createSport";
import { updateSport } from "~/lib/services/sports/updateSport";
import { deleteSport } from "~/lib/services/sports/deleteSport";
import { Button } from "~/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import SportDialog from "~/lib/components/sports/sport-dialog";
import type { Route } from "./+types/tournament-detail";
import { BASE_URL } from "~/lib/services/auth/loginService";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tournament Detail" }];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token) return { tournament: null, sports: [] };

  const [tournamentRes, sportsRes] = await Promise.all([
    getTournament({ token, id: params.id }),
    getAllSports({ token, tournamentId: params.id }),
  ]);

  return {
    tournament: tournamentRes.success ? tournamentRes.data : null,
    sports: sportsRes.success ? sportsRes.data : [],
  };
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token)
    return {
      success: false,
      error_code: "UNAUTHORIZED",
      message: "Unauthorized",
    };

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "create_sport") {
    const name = formData.get("name") as string;
    const image = formData.get("image") as File;
    const response = await createSport({
      token,
      body: { tournament_id: params.id, name, image },
    });
    return { ...response, _action };
  }

  if (_action === "update_sport") {
    const sportId = formData.get("sportId") as string;
    const name = formData.get("name") as string;
    const image = formData.get("image") as File;
    const response = await updateSport({
      token,
      id: sportId,
      body: { name, image, tournament_id: params.id },
    });
    return { ...response, _action };
  }

  if (_action === "delete_sport") {
    const sportId = formData.get("sportId") as string;
    const response = await deleteSport({ token, id: sportId });
    return { ...response, _action };
  }

  return {
    success: false,
    error_code: "UNKNOWN_ACTION",
    message: "Unknown action",
  };
}

type Sport = {
  id: string;
  name: string;
  image_url: string;
};

const TournamentDetail = ({ loaderData }: Route.ComponentProps) => {
  const { tournament, sports } = loaderData;
  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<IResponseDataSport | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [sportToDelete, setSportToDelete] = useState<IResponseDataSport | null>(
    null,
  );
  const deleteFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData?.success) {
      setCreateOpen(false);
      setEditOpen(false);
      setSelectedSport(null);
      setSportToDelete(null);
    }
  }, [navigation.state, actionData]);

  if (!tournament) {
    return (
      <div className="text-center text-gray-500 py-8">Tournament not found</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{tournament.name}</h1>
      <img
        src={`${BASE_URL}${tournament.image_url}`}
        alt={tournament.name}
        className="w-full h-64 object-cover rounded-lg mb-8"
      />

      {/* Sports section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Sports</h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          + Add Sport
        </Button>
      </div>

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
                src={`${BASE_URL}${sport.image_url}`}
                alt={sport.name}
                className="w-14 h-14 object-cover rounded-lg shrink-0"
              />
              <span className="flex-1 font-medium text-gray-800">
                {sport.name}
              </span>
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setSelectedSport(sport);
                    setEditOpen(true);
                  }}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                  aria-label="Edit sport"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setSportToDelete(sport)}
                  className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                  aria-label="Delete sport"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-10 border border-dashed rounded-xl">
          No sports yet. Add one to get started.
        </div>
      )}

      {/* Hidden form for delete submission */}
      <Form method="post" ref={deleteFormRef}>
        <input type="hidden" name="_action" value="delete_sport" />
        <input type="hidden" name="sportId" value={sportToDelete?.id ?? ""} />
      </Form>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!sportToDelete}
        onOpenChange={(open) => {
          if (!open) setSportToDelete(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Sport</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {sportToDelete?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSportToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteFormRef.current?.requestSubmit()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SportDialog
        tournamentId={tournament.id}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <SportDialog
        tournamentId={tournament.id}
        sport={selectedSport}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedSport(null);
        }}
      />
    </div>
  );
};

export default TournamentDetail;
