import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÉCORCE — A Study in Scent",
  description:
    "A cinematic, interactive parfum concept exploring ten fragrances through material, motion and light. Demo concept: no real purchases.",
  openGraph: {
    title: "ÉCORCE — Maison de Parfum",
    description: "Ten scents. One continuous story.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#eee4da",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
