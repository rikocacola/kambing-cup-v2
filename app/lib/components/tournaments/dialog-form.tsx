import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/components/ui/dialog";
import { Button } from "~/lib/components/ui/button";
import { Form } from "react-router";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";

const DialogForm = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Tournament</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
        </DialogHeader>
        <Form
          className="px-12 py-8 flex flex-col gap-5"
          method="POST"
          encType="multipart/form-data"
        >
          <div className="grid w-full max-w-sm items-center gap-2">
            <Label htmlFor="name">Name</Label>
            <Input type="text" id="name" placeholder="Name" name="name" />
          </div>
          <div className="grid w-full max-w-sm items-center gap-2">
            <Label htmlFor="image">Image</Label>
            <Input type="file" id="image" name="image" accept="image/*" />
          </div>
          <Button type="submit">Create</Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DialogForm;
