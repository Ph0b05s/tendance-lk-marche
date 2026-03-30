# Fix : erreurs de build Vercel + "Failed to fetch"

## Problème 1 — `lib/` absent du repo (cause du build cassé)

Le `.gitignore` contient `/lib`, héritage d'un ancien projet Java.
Cette ligne exclut tout le dossier `lib/` de Next.js, qui n'est donc jamais
envoyé sur GitHub. Vercel ne peut pas compiler sans ces fichiers.

### Correction à apporter dans `.gitignore`

Retirer la ligne `/lib`. Remplacer le bloc "java placeholder" par :

```
# java placeholder (replaced by this project)
/src
/bin
out.txt
run_output*.txt
```

Puis commiter et pousser le dossier `lib/` :

```bash
git add .gitignore lib/
git commit -m "fix: add lib/ to repo (was excluded by legacy Java gitignore)"
git push
```

---

## Problème 2 — Timeout sur `/api/collect` (cause du "Failed to fetch")

La route `/api/collect` n'a pas de `maxDuration` défini.
Sur Vercel Hobby (timeout à 10s par défaut), la fonction peut être tuée
avant de répondre si Adzuna ou Google News sont lents — ce qui ferme
la connexion brutalement et donne `TypeError: Failed to fetch` dans le browser.

### Correction dans `app/api/collect/route.ts`

Ajouter `export const maxDuration = 30;` après les imports :

```ts
import { NextRequest, NextResponse } from "next/server";
import { fetchJobs } from "@/lib/collectors/adzuna";
import { fetchSectorNews } from "@/lib/collectors/google-news";
import type { CollectedData, ParsedQuery } from "@/lib/types";

// Nécessaire sur Vercel Hobby (10s par défaut sinon)
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // ... reste inchangé
```

### Correction dans `lib/collectors/adzuna.ts`

Ajouter un AbortController avec timeout de 7s sur le fetch Adzuna,
comme c'est déjà fait dans `google-news.ts`. Remplacer le bloc `return withRetry(...)` :

```ts
return withRetry(async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

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
```

---

## Ordre d'exécution recommandé

1. Corriger `.gitignore` (retirer `/lib`)
2. Corriger `app/api/collect/route.ts` (ajouter `maxDuration`)
3. Corriger `lib/collectors/adzuna.ts` (ajouter AbortController)
4. `git add .gitignore lib/ app/api/collect/route.ts lib/collectors/adzuna.ts`
5. `git commit -m "fix: lib/ gitignore + collect timeout"`
6. `git push`
