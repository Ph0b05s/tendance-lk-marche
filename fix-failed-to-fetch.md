# Fix : erreur "Failed to fetch" sur /api/collect

## Contexte

Quand l'utilisateur clique sur "Oui, lancer l'analyse", le navigateur reçoit
`TypeError: Failed to fetch` car la route `/api/collect` n'a pas de `maxDuration`
défini. Sur Vercel Hobby (timeout à 10s par défaut), la fonction est tuée avant
de répondre — la connexion est fermée brutalement, d'où l'erreur côté browser.

La route `/api/analyze` a déjà `export const maxDuration = 30`, mais `/api/collect`
est manquante.

De plus, l'appel Adzuna peut être très lent si les credentials sont invalides
(`withRetry` tente 3 fois avec backoff exponentiel). Il faut ajouter un timeout
explicite sur cet appel pour éviter de gaspiller les secondes disponibles.

---

## Changements à apporter

### 1. `app/api/collect/route.ts`

Ajouter `export const maxDuration = 30;` en haut du fichier, juste après les imports.

```ts
import { NextRequest, NextResponse } from "next/server";
import { fetchJobs } from "@/lib/collectors/adzuna";
import { fetchSectorNews } from "@/lib/collectors/google-news";
import type { CollectedData, ParsedQuery } from "@/lib/types";

// Même config que analyze/route.ts — nécessaire sur Vercel Hobby (10s default sinon)
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // ... reste inchangé
```

### 2. `lib/collectors/adzuna.ts`

Ajouter un `AbortController` avec un timeout de 7 secondes sur le `fetch` Adzuna,
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

## Vérification après le fix

1. Lancer `npm run dev`
2. Taper une requête (ex : "alternance RH Rennes")
3. Confirmer l'analyse
4. L'étape "Collecte des offres…" doit passer sans erreur réseau

Si les credentials Adzuna sont invalides, le mode démo s'active automatiquement
(comportement déjà prévu dans le code) et le rapport est généré avec des données
fictives — ce n'est pas un bug.
