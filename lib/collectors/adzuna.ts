import type { JobOffer } from "@/lib/types";
import { withRetry } from "@/lib/utils";

const BASE_URL = "https://api.adzuna.com/v1/api/jobs";

function contractTypeToAdzuna(type: string): string {
  const map: Record<string, string> = {
    CDI: "permanent",
    CDD: "contract",
    alternance: "contract",
    stage: "contract",
    freelance: "contract",
  };
  return map[type] ?? "permanent";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAdzunaJob(raw: any): JobOffer {
  return {
    id: String(raw.id ?? Math.random()),
    title: raw.title ?? "",
    company: raw.company?.display_name ?? "Entreprise inconnue",
    location: raw.location?.display_name ?? "",
    description: raw.description ?? "",
    postedAt: raw.created ?? "",
    contractType: raw.contract_type ?? "",
    url: raw.redirect_url ?? "",
  };
}

export async function fetchJobs(
  keywords: string,
  location: string,
  contractType?: string
): Promise<{ jobs: JobOffer[]; total: number }> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn("[adzuna] Clés API manquantes — mode démo");
    return getMockJobs(keywords, location);
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "50",
    what: keywords,
    where: location,
    "content-type": "application/json",
    sort_by: "date",
  });

  if (contractType) {
    params.append("contract_type", contractTypeToAdzuna(contractType));
  }

  return withRetry(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${BASE_URL}/fr/search/1?${params.toString()}`, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Adzuna API ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return {
      jobs: (data.results ?? []).map(mapAdzunaJob),
      total: data.count ?? 0,
    };
  });
}

// ── Mode démo ────────────────────────────────────────────────
function getMockJobs(keywords: string, location: string): { jobs: JobOffer[]; total: number } {
  const companies = [
    "Publicis Groupe",
    "LVMH",
    "Decathlon",
    "BNP Paribas",
    "Capgemini",
    "Orange",
    "L'Oréal",
    "Danone",
    "Renault",
    "Société Générale",
  ];

  const skills = ["Python", "SQL", "Excel", "PowerPoint", "Salesforce", "Google Analytics"];

  const jobs: JobOffer[] = companies.map((company, i) => ({
    id: `demo-${i}`,
    title: `${keywords} - ${["Senior", "Junior", "Lead", "Expert", "Manager"][i % 5]}`,
    company,
    location,
    description: `Nous recherchons un(e) professionnel(le) en ${keywords} pour rejoindre notre équipe à ${location}. Compétences requises : ${skills.slice(0, 3 + (i % 3)).join(", ")}. Rejoignez une équipe dynamique et innovante.`,
    postedAt: new Date(Date.now() - i * 86400000).toISOString(),
    contractType: "CDI",
    url: "#",
  }));

  return { jobs, total: 247 };
}
