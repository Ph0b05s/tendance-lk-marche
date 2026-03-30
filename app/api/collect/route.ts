import { NextRequest, NextResponse } from "next/server";
import { fetchJobs } from "@/lib/collectors/adzuna";
import { fetchSectorNews } from "@/lib/collectors/google-news";
import type { CollectedData, ParsedQuery } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { query }: { query: ParsedQuery } = await req.json();

    if (!query?.secteur) {
      return NextResponse.json({ error: "Requête parsée manquante" }, { status: 400 });
    }

    const keywords = query.keywords.join(" ") || query.secteur;

    // Collecte en parallèle — un échec partiel ne bloque pas le reste
    const [jobsResult, newsResult] = await Promise.allSettled([
      fetchJobs(keywords, query.localisation, query.typeContrat),
      fetchSectorNews(query.secteur, query.localisation),
    ]);

    const jobs =
      jobsResult.status === "fulfilled" ? jobsResult.value.jobs : [];
    const totalJobsFound =
      jobsResult.status === "fulfilled" ? jobsResult.value.total : 0;
    const news =
      newsResult.status === "fulfilled" ? newsResult.value : [];

    const sources: string[] = [];
    if (jobsResult.status === "fulfilled") sources.push("Adzuna");
    if (newsResult.status === "fulfilled") sources.push("Google News");

    if (jobsResult.status === "rejected") {
      console.error("[/api/collect] Adzuna failed:", jobsResult.reason);
    }
    if (newsResult.status === "rejected") {
      console.error("[/api/collect] Google News failed:", newsResult.reason);
    }

    const data: CollectedData = { jobs, news, totalJobsFound, sources };
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/collect]", err);
    return NextResponse.json({ error: "Erreur de collecte" }, { status: 500 });
  }
}
