"use client";

import type { MarketReport, CompanySignal, SkillFrequency } from "@/lib/types";
import { ExportButton } from "./ExportButton";
import { timeAgo } from "@/lib/utils";
import {
  TrendingUp,
  Building2,
  Zap,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  report: MarketReport;
}

const REPORT_ID = "market-report-content";

export function ReportDisplay({ report }: Props) {
  const { executiveSummary, trends, topCompanies, topSkills, totalJobsAnalyzed, isDemo } = report;

  return (
    <div className="w-full max-w-2xl space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            Rapport — {report.query.secteur}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {report.query.typeContrat} · {report.query.localisation} ·{" "}
            {totalJobsAnalyzed} offres analysées
          </p>
        </div>
        <ExportButton targetId={REPORT_ID} filename={`tendance-${report.query.secteur.replace(/\s+/g, "-").toLowerCase()}`} />
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/30 border border-amber-700/40 text-amber-300 text-xs">
          <AlertCircle size={12} />
          Mode démo — données simulées. Ajoutez vos clés API dans .env.local pour des données réelles.
        </div>
      )}

      {/* Contenu exportable */}
      <div id={REPORT_ID} className="space-y-4 bg-zinc-900 rounded-xl p-4">
        {/* Résumé exécutif */}
        <Section icon={<CheckCircle2 size={14} className="text-emerald-400" />} title="Résumé exécutif">
          <p className="text-sm text-zinc-300 leading-relaxed">{executiveSummary}</p>
        </Section>

        {/* Tendances */}
        <Section icon={<TrendingUp size={14} className="text-indigo-400" />} title="Tendances du secteur">
          <ul className="space-y-2">
            {trends.map((trend, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <ChevronRight size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                {trend}
              </li>
            ))}
          </ul>
        </Section>

        {/* Top entreprises */}
        <Section icon={<Building2 size={14} className="text-blue-400" />} title={`Top ${topCompanies.length} entreprises qui recrutent`}>
          <div className="space-y-2">
            {topCompanies.map((company, i) => (
              <CompanyRow key={company.name} rank={i + 1} company={company} />
            ))}
          </div>
        </Section>

        {/* Top compétences */}
        <Section icon={<Zap size={14} className="text-yellow-400" />} title={`Top ${topSkills.length} compétences recherchées`}>
          <div className="space-y-2">
            {topSkills.map((skill) => (
              <SkillBar key={skill.skill} skill={skill} max={topSkills[0]?.percentage ?? 100} />
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 pt-2 border-t border-zinc-800">
          <Clock size={11} />
          Généré le {new Date(report.generatedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function CompanyRow({ rank, company }: { rank: number; company: CompanySignal }) {
  const levelColor = {
    high: "text-emerald-400 bg-emerald-900/30 border-emerald-700/30",
    medium: "text-blue-400 bg-blue-900/30 border-blue-700/30",
    low: "text-zinc-400 bg-zinc-800 border-zinc-700",
  }[company.activityLevel];

  const levelLabel = { high: "Très actif", medium: "Actif", low: "Modéré" }[company.activityLevel];

  return (
    <div className="flex items-start gap-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 px-3 py-2.5">
      <span className="text-xs text-zinc-500 w-4 shrink-0 mt-0.5">#{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-zinc-100 truncate">{company.name}</span>
          <span className={cn("text-xs px-1.5 py-0.5 rounded border shrink-0", levelColor)}>
            {levelLabel}
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{company.recentActivity}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-indigo-300">{company.activeJobCount}</div>
        <div className="text-xs text-zinc-500">offres</div>
      </div>
    </div>
  );
}

function SkillBar({ skill, max }: { skill: SkillFrequency; max: number }) {
  const barWidth = max > 0 ? (skill.percentage / max) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-300 w-44 shrink-0 truncate">{skill.skill}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0 w-20 justify-end">
        <span className="text-xs text-zinc-500">{skill.count} offres</span>
        <span className="text-xs font-medium text-indigo-300 w-8 text-right">{skill.percentage}%</span>
      </div>
    </div>
  );
}
