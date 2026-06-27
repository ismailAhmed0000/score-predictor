import { createFileRoute, redirect } from "@tanstack/react-router";
import { isLoggedIn } from "../api/client";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: isLoggedIn() ? "/matches" : "/login" });
  },
});
