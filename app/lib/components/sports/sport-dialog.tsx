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

type Sport = {
  id: string;
  name: string;
  image_url: string;
};

type SportDialogProps = {
  tournamentId: string;
  sport?: Sport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SportDialog = ({
  tournamentId,
  sport,
  open,
  onOpenChange,
}: SportDialogProps) => {
  const isEdit = !!sport;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Sport" : "Create Sport"}</DialogTitle>
        </DialogHeader>
        <Form
          className="flex flex-col gap-5 pt-2"
          method="POST"
          encType="multipart/form-data"
        >
          <input type="hidden" name="tournament_id" value={tournamentId} />
          <input
            type="hidden"
            name="_action"
            value={isEdit ? "update_sport" : "create_sport"}
          />
          {isEdit && (
            <input type="hidden" name="sportId" value={sport.id} />
          )}

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="sport-name">Name</Label>
            <Input
              type="text"
              id="sport-name"
              name="name"
              placeholder="Sport name"
              defaultValue={sport?.name ?? ""}
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="sport-image">
              Image {isEdit && "(optional)"}
            </Label>
            {isEdit && sport.image_url && (
              <img
                src={sport.image_url}
                alt={sport.name}
                className="w-full h-32 object-cover rounded-md"
              />
            )}
            <Input
              type="file"
              id="sport-image"
              name="image"
              accept="image/*"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Update" : "Create"}</Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SportDialog;
