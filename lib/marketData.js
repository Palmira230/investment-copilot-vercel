const alphaVantageBaseUrl = "https://www.alphavantage.co/query";

export async function getQuote(symbol) {
  const cleanSymbol = normalizeSymbol(symbol);

  if (!cleanSymbol) {
    return {
      ok: false,
      configured: false,
      error: "Invalid symbol"
    };
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      configured: false,
      symbol: cleanSymbol,
      source: "alpha_vantage",
      message: "Market data provider is not configured. Add ALPHA_VANTAGE_API_KEY in Vercel."
    };
  }

  const url = new URL(alphaVantageBaseUrl);
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", cleanSymbol);
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url);

  if (!response.ok) {
    return {
      ok: false,
      configured: true,
      symbol: cleanSymbol,
      source: "alpha_vantage",
      error: `Provider returned HTTP ${response.status}`
    };
  }

  const payload = await response.json();

  if (payload.Note || payload.Information) {
    return {
      ok: false,
      configured: true,
      symbol: cleanSymbol,
      source: "alpha_vantage",
      error: payload.Note || payload.Information
    };
  }

  const quote = payload["Global Quote"];

  if (!quote || Object.keys(quote).length === 0) {
    return {
      ok: false,
      configured: true,
      symbol: cleanSymbol,
      source: "alpha_vantage",
      error: "No quote found for symbol"
    };
  }

  return {
    ok: true,
    configured: true,
    symbol: cleanSymbol,
    source: "alpha_vantage",
    price: parseNumber(quote["05. price"]),
    change: parseNumber(quote["09. change"]),
    changePercent: quote["10. change percent"] || null,
    volume: parseNumber(quote["06. volume"]),
    tradingDay: quote["07. latest trading day"] || null,
    fetchedAt: new Date().toISOString(),
    freshness: "Provider quote endpoint; realtime or delayed access depends on your Alpha Vantage plan and exchange rules."
  };
}

function normalizeSymbol(symbol) {
  const clean = String(symbol || "").trim().toUpperCase();
  return /^[A-Z0-9.-]{1,12}$/.test(clean) ? clean : "";
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
