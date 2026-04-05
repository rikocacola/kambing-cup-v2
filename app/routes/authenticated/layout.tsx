import { Outlet, redirect } from "react-router";

import type { Route } from "./+types/layout";
import { destroySession, getSession } from "~/sessions.server";
import { getUserService } from "~/lib/services/user/getUserService";
import Topbar from "~/lib/components/layouts/topbar";
import Sidebar from "~/lib/components/layouts/sidebar";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const accessToken = session.get("accessToken");
  if (!accessToken) {
    return redirect("/login");
  }
  const userInfo = await getUserService({ token: accessToken });
  
  if (userInfo.success === false) {
    return redirect("/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }

  return {
    userInfo,
  };
}

const AuthenticatedLayout = ({ loaderData }: Route.ComponentProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar userInfo={loaderData?.userInfo?.data} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-6 py-10 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
