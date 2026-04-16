import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import { Button } from "~/lib/components/ui/button";
import { Switch } from "~/lib/components/ui/switch";
import { Form } from "react-router";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import type { IResponseDataTournament } from "~/lib/services/tournaments/getAllTournaments";
import { BASE_URL } from "~/lib/services/auth/loginService";

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
  const [isActive, setIsActive] = useState(tournament?.is_active ?? false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!tournament) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tournament</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Form
            className="flex flex-col gap-5"
            method="POST"
            encType="multipart/form-data"
          >
            <input type="hidden" name="tournamentId" value={tournament.id} />
            <input type="hidden" name="_action" value="update" />
            <input type="hidden" name="is_active" value={String(isActive)} />
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
              <Label htmlFor="total_surah">Total Surah</Label>
              <Input
                type="number"
                id="total_surah"
                placeholder="Total Surah"
                name="total_surah"
                min={1}
                defaultValue={tournament.total_surah}
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="image">Image (optional)</Label>
              {(previewUrl ?? tournament.image_url) && (
                <img
                  src={previewUrl ?? `${BASE_URL}/${tournament.image_url}`}
                  alt={tournament.name}
                  className="w-full h-36 object-cover rounded-md"
                />
              )}
              <Input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
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
