import { getSession } from "~/sessions.server";
import type { Route } from "./+types/dashboard";
import { getAllTournaments } from "~/lib/services/tournaments/getAllTournaments";
import { createTournament } from "~/lib/services/tournaments/createTournament";
import DialogForm from "~/lib/components/tournaments/dialog-form";

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
  const name = formData.get("name") as string;
  const image = formData.get("image") as File;

  if (token) {
    const response = await createTournament({ token, body: { name, image } });

    return response;
  }
}

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
  const tournaments = loaderData.tournaments;
  console.log("tournaments", tournaments);
  return (
    <div>
      <div className="flex w-full justify-between">
        <h1>Dashboard</h1>
        <DialogForm />
      </div>
      <div></div>
    </div>
  );
};

export default Dashboard;
