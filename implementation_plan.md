# Implementation Plan — Tendance LK Marché

## Vue d'ensemble

Application web de veille marché emploi avec interface chatbot, collecte multi-sources et analyse IA via Claude.

---

## Stack technique retenu

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Framework | **Next.js 14** (App Router) + TypeScript | Full-stack, natif Vercel, API Routes intégrées |
| UI | **Tailwind CSS** + Radix UI + lucide-react | Rapide à développer, moderne |
| IA | **Anthropic Claude API** (`claude-sonnet-4-6`) | Analyse et parsing des requêtes |
| Jobs data | **Adzuna API** (gratuit, 1000 calls/jour) | Couvre le marché français, pas de partenariat requis |
| RSS | **rss-parser** | Google News, simple et fiable |
| State | **Zustand** | Gestion état chatbot léger |
| PDF export | **jsPDF** + **html2canvas** | Client-side, sans dépendance serveur |

> **Sources supprimées** : LinkedIn officiel (partenariat requis), Playwright (incompatible Vercel Hobby)

---

## Variables d'environnement requises

```bash
# .env.local
ANTHROPIC_API_KEY=        # console.anthropic.com ($5 crédit offert)
ADZUNA_APP_ID=            # developer.adzuna.com (gratuit)
ADZUNA_APP_KEY=           # developer.adzuna.com (gratuit)
```

> Sans clés API, l'application tourne en **mode démo** avec données simulées réalistes.

---

## Structure des dossiers

```
tendance-lk-marche/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       ├── chat/route.ts      ← parsing NLP requête utilisateur via Claude
│       ├── collect/route.ts   ← orchestrateur Adzuna + Google News RSS
│       └── analyze/route.ts   ← analyse Claude des données collectées
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── QueryConfirmation.tsx
│   │   └── TypingIndicator.tsx
│   └── report/
│       ├── ReportDisplay.tsx
│       └── ExportButton.tsx
├── lib/
│   ├── collectors/
│   │   ├── adzuna.ts
│   │   └── google-news.ts
│   ├── analyzers/
│   │   ├── query-parser.ts
│   │   └── market-analyzer.ts
│   ├── generators/
│   │   └── report-builder.ts
│   ├── types.ts
│   └── utils.ts
├── hooks/
│   └── useChatStore.ts
├── .env.example
└── package.json
```

---

## Flux de données

```
User input
  → POST /api/chat        (Claude parse secteur/contrat/lieu)
  → QueryConfirmation UI  (user confirme)
  → POST /api/collect     (Adzuna jobs + Google News RSS en parallèle)
  → POST /api/analyze     (Claude génère rapport structuré)
  → ReportDisplay         (rapport dans le chat)
  → ExportButton          (PDF optionnel)
```

---

## Ordre d'implémentation

1. Config files (package.json, next.config, tailwind, tsconfig)
2. Types & utils
3. Collectors (google-news d'abord, puis adzuna)
4. Analyzers (query-parser, market-analyzer)
5. Report builder + Zustand store
6. API routes
7. UI — chat
8. UI — report
9. App shell (layout, page, globals)
10. npm install + test
