import { Outlet, redirect } from "react-router";

import type { Route } from "./+types/layout";
import { getUserService } from "~/lib/services/user/getUserService";
import Topbar from "~/lib/components/layouts/topbar";
import Sidebar from "~/lib/components/layouts/sidebar";

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    return redirect("/login");
  }

  const userInfo = await getUserService({ token: accessToken });

  if (userInfo.success === false) {
    localStorage.removeItem("accessToken");
    return redirect("/login");
  }

  return { userInfo };
}

const AuthenticatedLayout = ({ loaderData }: Route.ComponentProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar userInfo={loaderData?.userInfo?.data?.data} />
      <div className="flex flex-1">
        <Sidebar role={loaderData?.userInfo?.data?.data?.role} />
        <main className="flex-1 px-6 py-10 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
