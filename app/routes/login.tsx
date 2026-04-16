import { redirect } from "react-router";
import type { Route } from "./+types/login";

import LoginPage from "~/lib/pages/login/login";
import { loginService } from "~/lib/services/auth/loginService";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Amaliah Cup" },
    { name: "description", content: "Login to Amaliah Cup" },
  ];
}

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const token = localStorage.getItem("accessToken");
  if (token) {
    return redirect("/dashboard");
  }
  return null;
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const response = await loginService({ email: username, password });

  const accessToken = response?.data?.token;
  if (!accessToken) {
    return { success: false, message: "Invalid email/password" };
  }

  console.log("response", response);

  localStorage.setItem("accessToken", accessToken);
  return redirect("/dashboard");
}

const Login = ({}: Route.ComponentProps) => {
  return <LoginPage />;
};

export default Login;
