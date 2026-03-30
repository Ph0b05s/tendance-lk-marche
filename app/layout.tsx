import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tendance LK Marché — Veille marché emploi",
  description:
    "Analysez le marché de l'emploi en temps réel : tendances sectorielles, entreprises qui recrutent, compétences recherchées.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body>{children}</body>
    </html>
  );
}
