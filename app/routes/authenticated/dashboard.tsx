import { getSession } from "~/sessions.server";
import type { Route } from "./+types/dashboard";
import { useOutletContext } from "react-router";
import { getAllTournaments } from "~/lib/services/tournaments/getAllTournaments";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  if (token) {
    const response = await getAllTournaments({ token });
    console.log("response", response);
    return { tournaments: response };
  }
  return { tournaments: null };
}

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
  console.log("loaderData", loaderData);
  return <div>Dashboard</div>;
};

export default Dashboard;
