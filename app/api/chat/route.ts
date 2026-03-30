import { NextRequest, NextResponse } from "next/server";
import { parseUserQuery } from "@/lib/analyzers/query-parser";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json({ error: "Requête invalide ou trop courte" }, { status: 400 });
    }

    const parsed = await parseUserQuery(query.trim());
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
