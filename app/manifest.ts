import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inbox Cleaner",
    short_name: "Inbox Cleaner",
    description: "Connect Gmail securely, review senders, and archive or trash bulk email in a few taps.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    icons: [],
  };
}
