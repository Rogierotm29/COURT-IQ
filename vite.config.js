import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // En desarrollo, las API routes no existen localmente
      // Puedes usar `vercel dev` en vez de `vite` para tener ambos
    },
  },
});
