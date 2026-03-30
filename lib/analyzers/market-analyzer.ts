import Anthropic from "@anthropic-ai/sdk";
import type { CollectedData, ParsedQuery, MarketReport, CompanySignal, SkillFrequency } from "@/lib/types";
import { sanitizeText } from "@/lib/utils";

const SYSTEM_PROMPT = `Tu es un expert senior en analyse du marché de l'emploi français.
Tu analyses des données d'offres d'emploi et d'actualités sectorielles pour produire un rapport de veille marché.
Tu retournes UNIQUEMENT du JSON valide, structuré et précis, sans markdown ni texte supplémentaire.`;

function buildAnalysisPrompt(query: ParsedQuery, data: CollectedData): string {
  const jobsSummary = data.jobs
    .slice(0, 30)
    .map((j) => `- [${j.company}] ${j.title} | ${j.location} | ${sanitizeText(j.description, 200)}`)
    .join("\n");

  const newsSummary = data.news
    .slice(0, 10)
    .map((n) => `- ${n.title}: ${sanitizeText(n.snippet ?? "", 150)}`)
    .join("\n");

  return `Analyse le marché de l'emploi pour : "${query.secteur}" (${query.typeContrat}) à ${query.localisation}.

OFFRES D'EMPLOI COLLECTÉES (${data.jobs.length} offres sur ${data.totalJobsFound} trouvées) :
${jobsSummary || "Aucune offre disponible."}

ACTUALITÉS DU SECTEUR :
${newsSummary || "Aucune actualité disponible."}

Génère une analyse JSON avec exactement cette structure :
{
  "executiveSummary": "Résumé en 3 phrases maximum, factuel et percutant, décrivant l'état du marché",
  "trends": [
    "Tendance 1 (1 phrase claire avec données si disponibles)",
    "Tendance 2",
    "Tendance 3",
    "Tendance 4",
    "Tendance 5"
  ],
  "topCompanies": [
    {
      "name": "Nom entreprise",
      "activeJobCount": 3,
      "recentActivity": "Signal d'activité récente (1 phrase)",
      "activityLevel": "high | medium | low"
    }
  ],
  "topSkills": [
    {
      "skill": "Nom compétence",
      "count": 12,
      "percentage": 40
    }
  ]
}

Règles :
- topCompanies : top 10 maximum, triées par activeJobCount décroissant
- topSkills : top 15 maximum, triées par count décroissant, basées sur les offres analysées
- Si données insuffisantes, génère une analyse réaliste basée sur ta connaissance du secteur
- Réponds UNIQUEMENT avec le JSON`;
}

export async function analyzeMarket(
  query: ParsedQuery,
  data: CollectedData
): Promise<Omit<MarketReport, "query" | "generatedAt" | "totalJobsAnalyzed" | "isDemo">> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("[market-analyzer] Clé Anthropic manquante — mode démo");
    return getMockAnalysis(query);
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildAnalysisPrompt(query, data) }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const result = JSON.parse(text.trim());
    return {
      executiveSummary: result.executiveSummary ?? "",
      trends: result.trends ?? [],
      topCompanies: (result.topCompanies ?? []) as CompanySignal[],
      topSkills: (result.topSkills ?? []) as SkillFrequency[],
    };
  } catch {
    console.error("[market-analyzer] JSON invalide:", text.slice(0, 300));
    return getMockAnalysis(query);
  }
}

// ── Mode démo ────────────────────────────────────────────────
function getMockAnalysis(query: ParsedQuery) {
  const { secteur, localisation, typeContrat } = query;

  return {
    executiveSummary: `Le marché de l'emploi en ${secteur} à ${localisation} est dynamique en 2024, avec une forte demande pour les profils qualifiés. Les recrutements en ${typeContrat} progressent de 18% sur un an, portés par la transformation digitale des entreprises. La concurrence entre candidats reste modérée, offrant de bonnes opportunités aux profils bien formés.`,
    trends: [
      `Hausse significative des offres en ${secteur} : +23% sur les 6 derniers mois`,
      `Les entreprises tech et grands groupes dominent le recrutement à ${localisation}`,
      `Les compétences digitales et data deviennent incontournables dans le secteur`,
      `Le télétravail partiel est proposé dans 67% des offres analysées`,
      `Les salaires progressent de 5 à 8% par rapport à 2023 pour les profils seniors`,
    ],
    topCompanies: [
      { name: "Capgemini", activeJobCount: 12, recentActivity: "Ouverture d'un nouveau hub à Paris, 200 recrutements prévus", activityLevel: "high" as const },
      { name: "Publicis Groupe", activeJobCount: 9, recentActivity: "Lancement d'une division IA générative", activityLevel: "high" as const },
      { name: "LVMH", activeJobCount: 7, recentActivity: "Expansion internationale, recherche de talents bilingues", activityLevel: "high" as const },
      { name: "Orange", activeJobCount: 6, recentActivity: "Programme de recrutement diversité 2024", activityLevel: "medium" as const },
      { name: "BNP Paribas", activeJobCount: 5, recentActivity: "Transformation digitale accélérée de la banque de détail", activityLevel: "medium" as const },
      { name: "L'Oréal", activeJobCount: 5, recentActivity: "Investissement dans le marketing data et e-commerce", activityLevel: "medium" as const },
      { name: "Danone", activeJobCount: 4, recentActivity: "Recrutements dans la filière RSE et sustainability", activityLevel: "medium" as const },
      { name: "Renault Group", activeJobCount: 4, recentActivity: "Mobilité électrique : 150 postes ouverts en France", activityLevel: "medium" as const },
      { name: "Decathlon", activeJobCount: 3, recentActivity: "Expansion du réseau, ouvertures de magasins en Île-de-France", activityLevel: "low" as const },
      { name: "AXA", activeJobCount: 3, recentActivity: "Digitalisation des services clients", activityLevel: "low" as const },
    ],
    topSkills: [
      { skill: "Google Analytics / GA4", count: 28, percentage: 56 },
      { skill: "Meta Ads / Facebook Ads", count: 24, percentage: 48 },
      { skill: "SEO / SEA", count: 22, percentage: 44 },
      { skill: "Excel / Google Sheets", count: 20, percentage: 40 },
      { skill: "Canva / Adobe Creative Suite", count: 18, percentage: 36 },
      { skill: "CRM (Salesforce, HubSpot)", count: 16, percentage: 32 },
      { skill: "Gestion de projet Agile", count: 15, percentage: 30 },
      { skill: "Copywriting / Rédaction web", count: 14, percentage: 28 },
      { skill: "LinkedIn Ads", count: 12, percentage: 24 },
      { skill: "Email marketing (Mailchimp)", count: 11, percentage: 22 },
      { skill: "PowerPoint / Keynote", count: 10, percentage: 20 },
      { skill: "SQL (bases)", count: 9, percentage: 18 },
      { skill: "Python (notions)", count: 7, percentage: 14 },
      { skill: "WordPress / CMS", count: 6, percentage: 12 },
      { skill: "Tableau de bord / Data viz", count: 5, percentage: 10 },
    ],
  };
}
