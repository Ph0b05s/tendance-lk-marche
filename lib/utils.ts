import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Retry avec backoff exponentiel
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: Error;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts - 1) {
        await sleep(baseDelayMs * Math.pow(2, attempt));
      }
    }
  }
  throw lastError!;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Nettoie le texte HTML/markdown pour Claude
export function sanitizeText(text: string, maxLength = 500): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

// Génère un ID unique simple
export function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// Formate une date ISO en "il y a X jours"
export function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "aujourd'hui";
    if (diffDays === 1) return "hier";
    if (diffDays < 7) return `il y a ${diffDays} jours`;
    if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaines`;
    return `il y a ${Math.floor(diffDays / 30)} mois`;
  } catch {
    return "";
  }
}

// Extrait les compétences fréquentes d'une liste de titres/descriptions
export function extractSkillFrequencies(
  texts: string[],
  knownSkills: string[]
): Array<{ skill: string; count: number; percentage: number }> {
  const total = texts.length;
  if (total === 0) return [];

  const counts: Record<string, number> = {};
  const normalized = texts.map((t) => t.toLowerCase());

  for (const skill of knownSkills) {
    const skillLower = skill.toLowerCase();
    counts[skill] = normalized.filter((t) => t.includes(skillLower)).length;
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}
