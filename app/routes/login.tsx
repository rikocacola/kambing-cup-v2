import { data, redirect } from "react-router";
import type { Route } from "./+types/login";

import LoginPage from "~/lib/pages/login/login";
import { loginService } from "~/lib/services/auth/loginService";
import { getSession, commitSession } from "~/sessions.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Kambing Cup" },
    { name: "description", content: "Login to Kambing Cup" },
  ];
}

export async function loader({ request }: Route.ClientLoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("accessToken")) {
    return redirect("/dashboard");
  }

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const response = await loginService({ username, password });
  console.log("response", response);

  const accessToken = response?.data?.token;
  console.log("kesini kan?", accessToken);
  if (!accessToken) {
    session.flash("error", "Invalid username/password");

    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  session.set("accessToken", accessToken);

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

const Login = ({}: Route.ComponentProps) => {
  return <LoginPage />;
};

export default Login;
