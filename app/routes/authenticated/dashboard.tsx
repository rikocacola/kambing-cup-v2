import { getSession } from "~/sessions.server";
import type { Route } from "./+types/dashboard";
import { getAllTournaments } from "~/lib/services/tournaments/getAllTournaments";
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

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
  const tournaments = loaderData.tournaments;
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
