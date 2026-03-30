import type { NewsArticle } from "@/lib/types";

export async function fetchSectorNews(
  secteur: string,
  localisation?: string
): Promise<NewsArticle[]> {
  const query = localisation
    ? `${secteur} emploi recrutement ${localisation}`
    : `${secteur} emploi recrutement France`;

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TendanceLK/1.0)" },
    });
    clearTimeout(timer);

    if (!res.ok) return getMockNews(secteur);

    const xml = await res.text();
    const items = parseRssItems(xml);
    return items.slice(0, 15);
  } catch (err) {
    console.error("[google-news] Erreur:", err);
    return getMockNews(secteur);
  }
}

// ── Parseur RSS XML minimaliste (sans dépendance) ────────────
function parseRssItems(xml: string): NewsArticle[] {
  const results: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = cleanCdata(getTag(block, "title"));
    const link = cleanCdata(getTag(block, "link"));
    const pubDate = getTag(block, "pubDate");
    const description = cleanHtml(cleanCdata(getTag(block, "description")));

    if (title) {
      results.push({
        title,
        link,
        publishedAt: pubDate,
        source: extractSource(title),
        snippet: description.slice(0, 200),
      });
    }
  }
  return results;
}

function getTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function cleanCdata(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function cleanHtml(str: string): string {
  return str
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSource(title: string): string {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

// ── Mode démo ─────────────────────────────────────────────────
function getMockNews(secteur: string): NewsArticle[] {
  return [
    {
      title: `Le secteur ${secteur} en forte croissance en 2024 - Les Echos`,
      link: "#",
      publishedAt: new Date().toISOString(),
      source: "Les Echos",
      snippet: `Le marché de l'emploi en ${secteur} connaît une dynamique sans précédent avec une hausse des recrutements de 23% sur un an.`,
    },
    {
      title: `Recrutements en hausse : ${secteur} cherche des talents - Le Monde`,
      link: "#",
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      source: "Le Monde",
      snippet: `Les entreprises multiplient les offres d'emploi face à une pénurie de compétences qualifiées en ${secteur}.`,
    },
    {
      title: `Tendances RH 2024 : les métiers qui recrutent en ${secteur} - Welcome to the Jungle`,
      link: "#",
      publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      source: "Welcome to the Jungle",
      snippet: `Analyse des tendances recrutement : compétences recherchées, salaires et perspectives en ${secteur}.`,
    },
  ];
}
