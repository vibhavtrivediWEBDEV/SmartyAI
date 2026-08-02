import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmartyAI — AI Workspace",
    short_name: "SmartyAI",
    description:
      "A macOS-inspired AI workspace for developers, teachers, students, and creators.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/app.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
