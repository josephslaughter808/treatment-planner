import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClearPath Care",
    short_name: "ClearPath",
    description:
      "Provider-guided patient education, intake sharing, medical history vault, and emergency disclosure tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5efe4",
    theme_color: "#0f766e",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
