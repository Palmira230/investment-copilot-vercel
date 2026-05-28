import { scoreAsset } from "../lib/scoring.js";

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

  if (!asset || typeof asset !== "object") {
    response.status(400).json({ error: "Missing asset object" });
    return;
  }

  const requiredNumbers = ["volatility", "liquidity", "diversification", "valuation", "momentum", "yieldQuality"];
  const missing = requiredNumbers.filter((field) => typeof asset[field] !== "number");

  if (!asset.symbol || !asset.name || missing.length > 0) {
    response.status(400).json({
      error: "Invalid asset payload",
      required: ["symbol", "name", ...requiredNumbers],
      missing
    });
    return;
  }

  const analysis = scoreAsset(
    {
      ...asset,
      trend: asset.trend || "RANGE",
      dataQuality: asset.dataQuality || "user_input",
      timeHorizon: asset.timeHorizon || "Uncertain; review before acting",
      risks: Array.isArray(asset.risks) && asset.risks.length > 0 ? asset.risks : ["Information is incomplete or uncertain"]
    },
    profile
  );

  response.status(200).json({
    disclaimer: "Educational analysis only. This is not financial advice and does not guarantee outcomes.",
    profile,
    asset: {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type || "Unknown"
    },
    analysis
  });
}
