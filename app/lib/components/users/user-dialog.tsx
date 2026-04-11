import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import { Button } from "~/lib/components/ui/button";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import type { IResponseDataUser } from "~/lib/services/users/getAllUsers";

const ROLES = ["ADMIN", "SUPERADMIN"];

type UserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: IResponseDataUser | null;
};

const UserDialog = ({ open, onOpenChange, user }: UserDialogProps) => {
  const navigation = useNavigation();
  const actionData = useActionData() as { success: boolean; message?: string; _action?: string } | undefined;
  const isSubmitting = navigation.state === "submitting";
  const isEditing = !!user;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");

  const relevantAction = isEditing ? "update_user" : "create_user";
  const errorMessage =
    open &&
    actionData?.success === false &&
    actionData?._action === relevantAction
      ? actionData.message
      : null;

  useEffect(() => {
    if (open) {
      setUsername(user?.username ?? "");
      setEmail(user?.email ?? "");
      setPassword("");
      setRole(user?.role ?? "ADMIN");
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <Form method="post" className="flex flex-col gap-4">
          <input
            type="hidden"
            name="_action"
            value={isEditing ? "update_user" : "create_user"}
          />
          {isEditing && (
            <input type="hidden" name="userId" value={user.id} />
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
              required={!isEditing}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {errorMessage}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add User"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
