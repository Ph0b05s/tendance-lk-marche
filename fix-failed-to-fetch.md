# Fix : erreurs de build Vercel + "Failed to fetch"

## Problème 0 — Vercel ne détecte pas le projet comme Next.js

**Erreur** : `No Output Directory named "public" found after the Build completed`

Le build Next.js réussit, mais Vercel cherche un dossier `public/` (comportement
site statique) au lieu de `.next/`. Le preset du projet est mal configuré.

### Option A — Sans toucher au code (recommandée)

Dans le dashboard Vercel :
Project Settings → General → Framework Preset → choisir **Next.js** → Save → Redeploy.

### Option B — Via le code

Créer un fichier `vercel.json` à la racine du projet :

```json
{
  "framework": "nextjs"
}
```

Puis commiter :

```bash
git add vercel.json
git commit -m "fix: add vercel.json to force Next.js framework preset"
git push
```

---

## Problème 1 — `lib/` absent du repo (cause du build cassé)

Le `.gitignore` contient `/lib`, héritage d'un ancien projet Java.
Cette ligne exclut tout le dossier `lib/` de Next.js, qui n'est donc jamais
envoyé sur GitHub. Vercel ne peut pas compiler sans ces fichiers.

### Correction dans `.gitignore`

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

1. Corriger le Framework Preset dans Vercel (Option A, sans code) **ou** créer `vercel.json` (Option B)
2. Corriger `.gitignore` (retirer `/lib`)
3. Corriger `app/api/collect/route.ts` (ajouter `maxDuration`)
4. Corriger `lib/collectors/adzuna.ts` (ajouter AbortController)
5. `git add vercel.json .gitignore lib/ app/api/collect/route.ts lib/collectors/adzuna.ts`
6. `git commit -m "fix: vercel preset + lib/ gitignore + collect timeout"`
7. `git push`
