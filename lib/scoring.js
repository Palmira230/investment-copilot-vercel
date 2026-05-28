const profileSettings = {
  conservative: {
    name: "Conservative",
    maxRiskForBuy: 42,
    watchRisk: 58,
    opportunityFloor: 68,
    riskPenaltyWeight: 0.42,
    warningLevel: 55
  },
  balanced: {
    name: "Balanced",
    maxRiskForBuy: 58,
    watchRisk: 72,
    opportunityFloor: 64,
    riskPenaltyWeight: 0.32,
    warningLevel: 70
  },
  growth: {
    name: "Growth",
    maxRiskForBuy: 72,
    watchRisk: 84,
    opportunityFloor: 62,
    riskPenaltyWeight: 0.24,
    warningLevel: 82
  }
};

export function getProfileSettings(profile) {
  return profileSettings[profile] || profileSettings.balanced;
}

export function scoreAsset(asset, profile = "balanced") {
  const settings = getProfileSettings(profile);
  const opportunityRaw =
    asset.momentum * 0.26 +
    asset.valuation * 0.2 +
    asset.liquidity * 0.16 +
    asset.diversification * 0.16 +
    asset.yieldQuality * 0.12 +
    (asset.trend === "UP" ? 10 : asset.trend === "RANGE" ? 4 : 0);

  const concentrationRisk = 100 - asset.diversification;
  const qualityRisk = asset.dataQuality === "live" ? 0 : 8;
  const riskRaw =
    asset.volatility * 0.42 +
    concentrationRisk * 0.24 +
    (100 - asset.liquidity) * 0.12 +
    (100 - asset.valuation) * 0.1 +
    qualityRisk;

  const opportunityScore = clamp(opportunityRaw - riskRaw * settings.riskPenaltyWeight * 0.28);
  const riskScore = clamp(riskRaw);
  const suggestedAction = chooseAction(opportunityScore, riskScore, settings);

  return {
    opportunityScore,
    riskScore,
    suggestedAction,
    reasoning: buildReasoning(asset, opportunityScore, riskScore, suggestedAction, settings),
    keyRisks: asset.risks,
    timeHorizon: asset.timeHorizon,
    tooRiskyForProfile: riskScore >= settings.warningLevel
  };
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function chooseAction(opportunityScore, riskScore, settings) {
  if (riskScore > settings.watchRisk) return "Avoid";
  if (opportunityScore >= settings.opportunityFloor && riskScore <= settings.maxRiskForBuy) {
    return "Buy";
  }
  if (opportunityScore >= 56 && riskScore <= settings.watchRisk) return "Hold";
  if (opportunityScore >= 44) return "Watch";
  return "Avoid";
}

function buildReasoning(asset, opportunityScore, riskScore, action, settings) {
  const reasons = [];

  if (asset.diversification >= 75) {
    reasons.push("Strong diversification supports capital protection.");
  } else if (asset.diversification <= 30) {
    reasons.push("Single-asset concentration increases downside risk.");
  }

  if (asset.volatility >= 70) {
    reasons.push("High volatility can create severe drawdowns.");
  } else if (asset.volatility <= 35) {
    reasons.push("Lower volatility makes position sizing easier.");
  }

  if (asset.valuation >= 60) {
    reasons.push("Valuation input is reasonable relative to the sample framework.");
  } else if (asset.valuation <= 40) {
    reasons.push("Valuation risk reduces the opportunity score.");
  }

  if (asset.trend === "UP") {
    reasons.push("Trend input is positive, but it is not a guarantee of future returns.");
  }

  if (riskScore > settings.maxRiskForBuy) {
    reasons.push(`${settings.name} profile risk limit is exceeded, so caution is required.`);
  }

  reasons.push(`Action is ${action} based on opportunity ${opportunityScore}/100 and risk ${riskScore}/100.`);
  return reasons;
}
