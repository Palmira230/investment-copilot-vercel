const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export async function createCopilotInsight({ asset, analysis, profile, question = "" }) {
  const fallback = buildFallbackInsight({ asset, analysis, profile, question });

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const providerResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: [
          "You are an educational investment analysis assistant for Investment Co-Pilot.",
          "Do not provide financial advice. Do not guarantee profits, fixed income, daily income, or certain outcomes.",
          "Prioritize capital protection, risk awareness, diversification, long-term thinking, and clear explanations.",
          "Return only valid JSON with keys: headline, summary, focusPoints, guardrail.",
          "focusPoints must be an array of exactly three short strings."
        ].join(" "),
        input: JSON.stringify({
          profile,
          asset: {
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type || "Unknown",
            timeHorizon: asset.timeHorizon || analysis.timeHorizon
          },
          analysis: {
            opportunityScore: analysis.opportunityScore,
            riskScore: analysis.riskScore,
            suggestedAction: analysis.suggestedAction,
            reasoning: analysis.reasoning,
            keyRisks: analysis.keyRisks,
            timeHorizon: analysis.timeHorizon,
            tooRiskyForProfile: analysis.tooRiskyForProfile
          },
          userQuestion: question || "Give a concise asset briefing."
        }),
        max_output_tokens: 450
      })
    });

    if (!providerResponse.ok) {
      return {
        ...fallback,
        source: "fallback",
        configured: true
      };
    }

    const payload = await providerResponse.json();
    const text = extractResponseText(payload);
    const parsed = JSON.parse(text);

    return sanitizeInsight(parsed, {
      source: "openai",
      configured: true
    });
  } catch {
    return {
      ...fallback,
      source: "fallback",
      configured: true
    };
  }
}

function buildFallbackInsight({ asset, analysis, profile, question }) {
  const profileLabel = profile ? `${profile[0].toUpperCase()}${profile.slice(1)}` : "Selected";
  const riskTone = analysis.riskScore >= 70 ? "high" : analysis.riskScore >= 45 ? "moderate" : "lower";
  const questionContext = question ? ` Question reviewed: "${question}".` : "";

  return {
    configured: false,
    source: "rules",
    headline: `${asset.symbol}: ${analysis.suggestedAction} with ${riskTone} risk`,
    summary: `${profileLabel} guardrails place this asset at opportunity ${analysis.opportunityScore}/100 and risk ${analysis.riskScore}/100.${questionContext} Treat this as educational context, not a trading instruction.`,
    focusPoints: [
      `Review whether ${analysis.timeHorizon} matches your real decision window.`,
      `Check position size before adding exposure to ${asset.symbol}.`,
      `Key risk: ${analysis.keyRisks?.[0] || "Information may be incomplete or uncertain."}`
    ],
    guardrail: analysis.tooRiskyForProfile
      ? "Risk is above the selected profile guardrail. Slow down and review downside scenarios first."
      : "No profit or outcome is guaranteed. Keep diversification and capital protection first."
  };
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  const message = payload?.output?.find((item) => item.type === "message");
  const textItem = message?.content?.find((item) => item.type === "output_text");
  return textItem?.text || "{}";
}

function sanitizeInsight(value, meta) {
  return {
    ...meta,
    headline: String(value?.headline || "AI review unavailable").slice(0, 120),
    summary: String(value?.summary || "Review risk, time horizon, and diversification before acting.").slice(0, 360),
    focusPoints: Array.isArray(value?.focusPoints)
      ? value.focusPoints.slice(0, 3).map((item) => String(item).slice(0, 140))
      : [
          "Review the opportunity score and risk score together.",
          "Confirm the time horizon matches the selected profile.",
          "Consider diversification before increasing exposure."
        ],
    guardrail: String(value?.guardrail || "Educational analysis only. This is not financial advice.").slice(0, 180)
  };
}
