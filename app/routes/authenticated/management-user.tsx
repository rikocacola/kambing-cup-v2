import { useEffect, useRef, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import {
  getAllUsers,
  type IResponseDataUser,
} from "~/lib/services/users/getAllUsers";
import { createUser } from "~/lib/services/users/createUser";
import { updateUser } from "~/lib/services/users/updateUser";
import { deleteUser } from "~/lib/services/users/deleteUser";
import { Button } from "~/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import UserDialog from "~/lib/components/users/user-dialog";
import type { Route } from "./+types/management-user";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Management User" }];
}

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token) return { users: [] };

  const response = await getAllUsers({ token });
  return { users: response.success ? response.data : [] };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const token = localStorage.getItem("accessToken") ?? "";
  if (!token)
    return {
      success: false,
      error_code: "UNAUTHORIZED",
      message: "Unauthorized",
    };

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "create_user") {
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const response = await createUser({
      token,
      body: { username, email, role, password },
    });
    return { ...response, _action };
  }

  if (_action === "update_user") {
    const userId = Number(formData.get("userId"));
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const password = formData.get("password") as string;
    const body: { username: string; email: string; role: string; password?: string } = { username, email, role };
    if (password) body.password = password;
    const response = await updateUser({ token, id: userId, body });
    return { ...response, _action };
  }

  if (_action === "delete_user") {
    const userId = Number(formData.get("userId"));
    const response = await deleteUser({ token, id: userId });
    return { ...response, _action };
  }

  return {
    success: false,
    error_code: "UNKNOWN_ACTION",
    message: "Unknown action",
  };
}

const ManagementUser = ({ loaderData }: Route.ComponentProps) => {
  const { users } = loaderData;

  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IResponseDataUser | null>(
    null,
  );
  const [userToDelete, setUserToDelete] = useState<IResponseDataUser | null>(
    null,
  );
  const deleteFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData?.success) {
      setDialogOpen(false);
      setSelectedUser(null);
      setUserToDelete(null);
    }
  }, [navigation.state, actionData]);

  const handleEdit = (user: IResponseDataUser) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleAddClick = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Management User</h1>
        <Button size="sm" onClick={handleAddClick}>
          + Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-medium">Username</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map((user: IResponseDataUser) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {user.role !== "SUPERADMIN" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                            aria-label="Edit user"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                            aria-label="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden form for delete submission */}
      <Form method="post" ref={deleteFormRef}>
        <input type="hidden" name="_action" value="delete_user" />
        <input type="hidden" name="userId" value={userToDelete?.id ?? ""} />
      </Form>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {userToDelete?.username}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
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

      {/* Upsert dialog */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};

export default ManagementUser;
