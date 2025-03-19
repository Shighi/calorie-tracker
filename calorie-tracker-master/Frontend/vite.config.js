import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Allows imports like "@/components/Navbar"
    },
  },
  server: {
    port: 5173, // Change port if needed
  },
});
