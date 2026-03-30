"use client";

import type { ParsedQuery } from "@/lib/types";
import { useChatStore } from "@/hooks/useChatStore";
import { Briefcase, MapPin, FileText, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  query: ParsedQuery;
  disabled?: boolean;
}

const CONTRACT_LABELS: Record<string, string> = {
  CDI: "CDI",
  CDD: "CDD",
  alternance: "Alternance",
  stage: "Stage",
  freelance: "Freelance",
};

export function QueryConfirmation({ query, disabled }: Props) {
  const { confirmQuery, reset, phase } = useChatStore();
  const isConfirmed = phase === "collecting" || phase === "analyzing" || phase === "done";

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 max-w-md animate-slide-up">
      <p className="text-sm text-zinc-400 mb-3 font-medium">Paramètres détectés :</p>

      <div className="space-y-2 mb-4">
        <Param
          icon={<Briefcase size={14} className="text-indigo-400" />}
          label="Secteur"
          value={query.secteur}
        />
        <Param
          icon={<FileText size={14} className="text-indigo-400" />}
          label="Contrat"
          value={CONTRACT_LABELS[query.typeContrat] ?? query.typeContrat}
        />
        <Param
          icon={<MapPin size={14} className="text-indigo-400" />}
          label="Localisation"
          value={query.localisation}
        />
      </div>

      {!isConfirmed && !disabled && (
        <div className="flex gap-2">
          <button
            onClick={() => confirmQuery()}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
          >
            <CheckCircle2 size={14} />
            Oui, lancer l'analyse
          </button>
          <button
            onClick={() => reset()}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
              "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
            )}
          >
            <RefreshCw size={14} />
            Modifier
          </button>
        </div>
      )}

      {isConfirmed && (
        <p className="text-xs text-indigo-400 flex items-center gap-1">
          <CheckCircle2 size={12} /> Confirmé — analyse en cours
        </p>
      )}
    </div>
  );
}

function Param({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="text-zinc-500 w-24 shrink-0">{label}</span>
      <span className="text-zinc-100 font-medium">{value}</span>
    </div>
  );
}
