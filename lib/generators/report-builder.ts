import type { CollectedData, MarketReport, ParsedQuery } from "@/lib/types";
import { analyzeMarket } from "@/lib/analyzers/market-analyzer";

export async function buildReport(
  query: ParsedQuery,
  data: CollectedData
): Promise<MarketReport> {
  const isDemo = !process.env.ANTHROPIC_API_KEY;

  const analysis = await analyzeMarket(query, data);

  return {
    query,
    generatedAt: new Date().toISOString(),
    executiveSummary: analysis.executiveSummary,
    trends: analysis.trends,
    topCompanies: analysis.topCompanies,
    topSkills: analysis.topSkills,
    totalJobsAnalyzed: data.jobs.length,
    isDemo,
  };
}
