import { NextRequest, NextResponse } from "next/server";
import { buildReport } from "@/lib/generators/report-builder";
import type { CollectedData, ParsedQuery } from "@/lib/types";

// Vercel Hobby : 10s max. Pro : jusqu'à 60s.
// L'analyse Claude peut prendre 5-15s selon la charge.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { query, data }: { query: ParsedQuery; data: CollectedData } =
      await req.json();

    if (!query?.secteur || !data) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const report = await buildReport(query, data);
    return NextResponse.json(report);
  } catch (err) {
    console.error("[/api/analyze]", err);
    return NextResponse.json({ error: "Erreur d'analyse" }, { status: 500 });
  }
}
