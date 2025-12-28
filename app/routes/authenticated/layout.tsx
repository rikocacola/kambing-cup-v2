import { Outlet, redirect } from "react-router";

import type { Route } from "./+types/layout";
import { getSession } from "~/sessions.server";
import { getUserService } from "~/lib/services/user/getUserService";
import Topbar from "~/lib/components/layouts/topbar";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const accessToken = session.get("accessToken");
  if (!accessToken) {
    return redirect("/login");
  }
  const userInfo = await getUserService({ token: accessToken });
  return {
    userInfo,
  };
}

const AuthenticatedLayout = ({ loaderData }: Route.ComponentProps) => {
  return (
    <div>
      <Topbar userInfo={loaderData?.userInfo?.data} />
      <div className="px-6 py-10">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
