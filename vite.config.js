import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || (command === "build" ? "./" : "/"),
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    watch: {
      ignored: ["**/out/**", "**/dist/**"],
    },
  },
}));
