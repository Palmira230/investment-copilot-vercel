import { scoreAsset } from "../lib/scoring.js";
import { createCopilotInsight } from "../lib/aiCopilot.js";

const allowedProfiles = new Set(["conservative", "balanced", "growth"]);

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const profile = allowedProfiles.has(body.profile) ? body.profile : "balanced";
  const asset = body.asset;
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 240) : "";

  if (!asset || typeof asset !== "object" || !asset.symbol || !asset.name) {
    response.status(400).json({ error: "Missing asset object" });
    return;
  }

  const analysis = body.analysis?.opportunityScore
    ? body.analysis
    : scoreAsset(
        {
          ...asset,
          trend: asset.trend || "RANGE",
          dataQuality: asset.dataQuality || "user_input",
          timeHorizon: asset.timeHorizon || "Uncertain; review before acting",
          risks: Array.isArray(asset.risks) && asset.risks.length > 0 ? asset.risks : ["Information is incomplete or uncertain"]
        },
        profile
      );

  const insight = await createCopilotInsight({ asset, analysis, profile, question });

  response.status(200).json({
    disclaimer: "Educational AI analysis only. This is not financial advice and does not guarantee profits, income, or outcomes.",
    profile,
    asset: {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type || "Unknown"
    },
    question,
    insight
  });
}
