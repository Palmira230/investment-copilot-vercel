export default function handler(request, response) {
  response.status(200).json({
    ok: true,
    service: "investment-copilot-api",
    timestamp: new Date().toISOString()
  });
}
