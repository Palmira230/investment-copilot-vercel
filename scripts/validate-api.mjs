import analyze from "../api/analyze.js";
import copilot from "../api/copilot.js";
import health from "../api/health.js";
import quote from "../api/quote.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

const healthResponse = createResponse();
health({}, healthResponse);

if (healthResponse.statusCode !== 200 || healthResponse.body?.ok !== true) {
  throw new Error("Health route failed validation");
}

const analyzeResponse = createResponse();
await analyze(
  {
    method: "POST",
    body: {
      profile: "balanced",
      asset: {
        symbol: "VOO",
        name: "Vanguard S&P 500 ETF",
        type: "ETF",
        trend: "UP",
        volatility: 32,
        liquidity: 95,
        diversification: 92,
        valuation: 61,
        momentum: 72,
        yieldQuality: 58,
        dataQuality: "sample",
        timeHorizon: "5+ years",
        risks: ["Broad equity market drawdowns", "Concentration risk"]
      }
    }
  },
  analyzeResponse
);

const analysis = analyzeResponse.body?.analysis;
const actionValid = ["Buy", "Hold", "Watch", "Avoid"].includes(analysis?.suggestedAction);

if (analyzeResponse.statusCode !== 200 || !actionValid) {
  throw new Error("Analyze route failed validation");
}

const copilotResponse = createResponse();
await copilot(
  {
    method: "POST",
    body: {
      profile: "balanced",
      asset: {
        symbol: "VOO",
        name: "Vanguard S&P 500 ETF",
        type: "ETF",
        trend: "UP",
        volatility: 32,
        liquidity: 95,
        diversification: 92,
        valuation: 61,
        momentum: 72,
        yieldQuality: 58,
        dataQuality: "sample",
        timeHorizon: "5+ years",
        risks: ["Broad equity market drawdowns", "Concentration risk"]
      },
      analysis
    }
  },
  copilotResponse
);

if (copilotResponse.statusCode !== 200 || !Array.isArray(copilotResponse.body?.insight?.focusPoints)) {
  throw new Error("Copilot route failed validation");
}

const quoteResponse = createResponse();
await quote(
  {
    method: "GET",
    query: {
      symbol: "VOO"
    }
  },
  quoteResponse
);

if (quoteResponse.statusCode !== 200 || quoteResponse.body?.symbol !== "VOO") {
  throw new Error("Quote route failed validation");
}

console.log("Validated Vercel health, analyze, copilot, and quote routes.");
