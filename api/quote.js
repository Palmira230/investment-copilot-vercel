import { getQuote } from "../lib/marketData.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const symbol = request.query?.symbol;
  const quote = await getQuote(symbol);

  response.status(quote.ok ? 200 : quote.configured ? 502 : 200).json({
    disclaimer: "Market data is informational only and may be delayed or unavailable. It is not financial advice.",
    ...quote
  });
}
