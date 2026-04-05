import { redirect } from "react-router";
import type { Route } from "./+types/logout";

export async function clientAction({}: Route.ClientActionArgs) {
  localStorage.removeItem("accessToken");
  return redirect("/login");
}
