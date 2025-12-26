import type { Route } from "./+types/login";

import LoginPage from "~/pages/login/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Kambing Cup" },
    { name: "description", content: "Login to Kambing Cup" },
  ];
}

const Login = () => {
  return <LoginPage />;
};

export default Login;
