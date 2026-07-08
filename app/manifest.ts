import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boneless Bangus AI",
    short_name: "BBAI",
    description: "Livro Systems' internal assistant for tasks, QA, and school setup support.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6fafa",
    theme_color: "#0a5c66",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
