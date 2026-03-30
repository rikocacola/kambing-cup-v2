import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/live-match.tsx"),
  route("/live-match/:sport", "routes/live-match.$sport.tsx"),
  route("/login", "routes/login.tsx"),
  route("/logout", "routes/logout.tsx"),
  layout("routes/authenticated/layout.tsx", [
    route("dashboard", "routes/authenticated/dashboard.tsx"),
    route("dashboard/tournaments/:id", "routes/authenticated/tournament-detail.tsx"),
  ]),
] satisfies RouteConfig;
