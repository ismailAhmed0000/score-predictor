import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

function normalizeApiUrl(raw: string): string {
  const url = raw.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("localhost") || url.startsWith("127.0.0.1")) {
    return `http://${url}`;
  }
  return `https://${url}`;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = normalizeApiUrl(
    env.VITE_API_URL ?? "http://localhost:3000",
  );

  return {
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
    },
    plugins: [
      tailwindcss(),
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      react(),
    ],
    server: {
      port: 5173,
    },
  };
});
