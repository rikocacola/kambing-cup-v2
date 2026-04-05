import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import { Button } from "~/lib/components/ui/button";
import { Form } from "react-router";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import type { IResponseDataTournament } from "~/lib/services/tournaments/getAllTournaments";

type TournamentDetailDialogProps = {
  tournament: IResponseDataTournament | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TournamentDetailDialog = ({
  tournament,
  open,
  onOpenChange,
}: TournamentDetailDialogProps) => {
  if (!tournament) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tournament</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <img
            src={tournament.image_url}
            alt={tournament.name}
            className="w-full h-48 object-cover rounded-md"
          />
          <Form
            className="flex flex-col gap-5"
            method="POST"
            encType="multipart/form-data"
          >
            <input type="hidden" name="tournamentId" value={tournament.id} />
            <input type="hidden" name="_action" value="update" />
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                id="name"
                placeholder="Name"
                name="name"
                defaultValue={tournament.name}
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="image">Image (optional)</Label>
              <Input type="file" id="image" name="image" accept="image/*" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="submit">Update</Button>
            </div>
          </Form>
          <Form method="POST" className="flex justify-end">
            <input type="hidden" name="tournamentId" value={tournament.id} />
            <input type="hidden" name="_action" value="delete" />
            <Button
              type="submit"
              variant="destructive"
              className="cursor-pointer"
            >
              Delete
            </Button>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentDetailDialog;
