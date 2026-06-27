import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUser, isLoggedIn } from "../api/client";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login" });
    }
    const user = getUser();
    throw redirect({ to: user?.isAdmin ? "/admin" : "/matches" });
  },
});
