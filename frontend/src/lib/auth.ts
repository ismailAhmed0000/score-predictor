import { clearToken, isLoggedIn } from "../api/client";
import { redirect } from "@tanstack/react-router";

export function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    throw redirect({ to: "/matches" });
  }
}

export function requireAuth() {
  if (!isLoggedIn()) {
    throw redirect({ to: "login" });
  }
}

export function logout() {
  clearToken();
  throw redirect({ to: "/login" });
}
