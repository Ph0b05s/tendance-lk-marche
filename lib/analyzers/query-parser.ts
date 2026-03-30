import Anthropic from "@anthropic-ai/sdk";
import type { ParsedQuery } from "@/lib/types";

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de recherches d'emploi en français.
Tu extrais de façon précise les paramètres d'une requête utilisateur et retournes UNIQUEMENT du JSON valide, sans markdown ni texte supplémentaire.`;

const USER_PROMPT_TEMPLATE = (query: string) => `Analyse cette recherche d'emploi et extrait les paramètres :

"${query}"

Retourne un objet JSON avec exactement ces champs :
{
  "secteur": "le domaine ou métier principal (ex: marketing digital, développement web, finance)",
  "typeContrat": "CDI | CDD | alternance | stage | freelance (choisis le plus probable si non précisé, défaut CDI)",
  "localisation": "ville ou région (ex: Paris, Lyon, Île-de-France ; 'France' si non précisé)",
  "keywords": ["3 à 5 mots-clés pertinents pour une recherche d'offres"]
}

Réponds UNIQUEMENT avec le JSON, pas de markdown, pas d'explication.`;

export async function parseUserQuery(raw: string): Promise<ParsedQuery> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("[query-parser] Clé Anthropic manquante — mode démo");
    return getMockParsedQuery(raw);
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: USER_PROMPT_TEMPLATE(raw) }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text.trim()) as Omit<ParsedQuery, "raw">;
    return { ...parsed, raw };
  } catch {
    console.error("[query-parser] JSON invalide reçu:", text);
    return getMockParsedQuery(raw);
  }
}

function getMockParsedQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase();

  const typeContrat = lower.includes("alternance")
    ? "alternance"
    : lower.includes("stage")
    ? "stage"
    : lower.includes("cdd")
    ? "CDD"
    : lower.includes("freelance")
    ? "freelance"
    : "CDI";

  const localisation = lower.includes("paris")
    ? "Paris"
    : lower.includes("lyon")
    ? "Lyon"
    : lower.includes("bordeaux")
    ? "Bordeaux"
    : lower.includes("marseille")
    ? "Marseille"
    : "France";

  // Extraction naïve du secteur
  const secteurWords = raw
    .replace(/je cherche|un|une|poste|emploi|travail|en|à|sur|pour|dans|contrat/gi, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .join(" ");

  return {
    secteur: secteurWords || "Secteur non précisé",
    typeContrat,
    localisation,
    keywords: secteurWords.split(" ").filter(Boolean),
    raw,
  };
}
