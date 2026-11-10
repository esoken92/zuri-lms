import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zuri LMS — Community Edition",
    short_name: "Zuri LMS",
    description:
      "Self-hosted tyre inspection and fleet logistics for small fleets. MIT licensed.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f3",
    theme_color: "#724b1a",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
