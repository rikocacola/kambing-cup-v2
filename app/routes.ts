import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/live-match.tsx"),
  route("/login", "routes/login.tsx"),
  route("/logout", "routes/logout.tsx"),
  layout("routes/authenticated/layout.tsx", [
    route("dashboard", "routes/authenticated/dashboard.tsx"),
  ]),
] satisfies RouteConfig;
