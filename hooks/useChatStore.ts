"use client";

import { create } from "zustand";
import type { ChatMessage, ChatPhase, MarketReport, ParsedQuery } from "@/lib/types";
import { genId } from "@/lib/utils";

interface ChatStore {
  messages: ChatMessage[];
  phase: ChatPhase;
  parsedQuery: ParsedQuery | null;
  report: MarketReport | null;
  error: string | null;

  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setPhase: (phase: ChatPhase) => void;
  setParsedQuery: (q: ParsedQuery) => void;
  setReport: (r: MarketReport) => void;
  setError: (e: string | null) => void;
  reset: () => void;

  // Actions composées
  submitQuery: (raw: string) => Promise<void>;
  confirmQuery: () => Promise<void>;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  type: "text",
  content:
    "Bonjour ! Je suis votre assistant de veille marché emploi. Décrivez votre recherche en langage naturel — secteur, type de contrat et localisation — et je génèrerai un rapport complet sur le marché correspondant.\n\nExemples :\n• « Je cherche une alternance en marketing digital à Paris »\n• « Offres CDI développeur React Lyon »\n• « Stage data science Île-de-France »",
  timestamp: new Date(),
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [INITIAL_MESSAGE],
  phase: "idle",
  parsedQuery: null,
  report: null,
  error: null,

  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: genId(), timestamp: new Date() }],
    })),

  setPhase: (phase) => set({ phase }),
  setParsedQuery: (parsedQuery) => set({ parsedQuery }),
  setReport: (report) => set({ report }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      messages: [INITIAL_MESSAGE],
      phase: "idle",
      parsedQuery: null,
      report: null,
      error: null,
    }),

  // ── Étape 1 : envoyer la requête + parsing Claude ─────────
  submitQuery: async (raw) => {
    const { addMessage, setPhase, setParsedQuery } = get();

    addMessage({ role: "user", type: "text", content: raw });
    setPhase("parsing");
    addMessage({
      role: "assistant",
      type: "progress",
      content: "Analyse de votre recherche en cours…",
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: raw }),
      });

      if (!res.ok) throw new Error("Erreur lors du parsing de la requête");

      const parsed: ParsedQuery = await res.json();
      setParsedQuery(parsed);

      // Remplace le message "en cours" par la confirmation
      set((s) => ({
        messages: s.messages.filter((m) => m.type !== "progress"),
      }));

      addMessage({
        role: "assistant",
        type: "confirmation",
        content: `J'ai détecté les paramètres suivants :`,
        data: parsed,
      });

      setPhase("confirming");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      set((s) => ({
        messages: s.messages.filter((m) => m.type !== "progress"),
      }));
      addMessage({ role: "assistant", type: "error", content: `Désolé, une erreur est survenue : ${msg}` });
      setPhase("error");
    }
  },

  // ── Étape 2 : collecte + analyse + rapport ────────────────
  confirmQuery: async () => {
    const { parsedQuery, addMessage, setPhase, setReport } = get();
    if (!parsedQuery) return;

    addMessage({ role: "user", type: "text", content: "Oui, c'est correct. Lancez l'analyse !" });
    setPhase("collecting");
    addMessage({
      role: "assistant",
      type: "progress",
      content: "Collecte des offres d'emploi et des actualités du secteur…",
    });

    try {
      // Collecte
      const collectRes = await fetch("/api/gather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: parsedQuery }),
      });

      if (!collectRes.ok) throw new Error("Erreur lors de la collecte des données");

      set((s) => ({
        messages: s.messages.filter((m) => m.type !== "progress"),
      }));

      addMessage({
        role: "assistant",
        type: "progress",
        content: "Analyse IA du marché en cours… (peut prendre 10-20 secondes)",
      });

      setPhase("analyzing");

      const collectedData = await collectRes.json();

      // Analyse
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: parsedQuery, data: collectedData }),
      });

      if (!analyzeRes.ok) throw new Error("Erreur lors de l'analyse");

      const report: MarketReport = await analyzeRes.json();

      set((s) => ({
        messages: s.messages.filter((m) => m.type !== "progress"),
      }));

      setReport(report);
      addMessage({
        role: "assistant",
        type: "report",
        content: "Voici votre rapport de veille marché :",
        data: report,
      });

      setPhase("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      set((s) => ({
        messages: s.messages.filter((m) => m.type !== "progress"),
      }));
      addMessage({
        role: "assistant",
        type: "error",
        content: `Désolé, une erreur est survenue : ${msg}. Veuillez réessayer.`,
      });
      setPhase("error");
    }
  },
}));
