# Investment Co-Pilot Vercel Companion

Vercel-ready public website and API backend for the Investment Co-Pilot mobile app.

## Included

- `/` landing page
- `/privacy` privacy policy starter
- `/terms` terms starter
- `/api/health` deployment health check
- `/api/analyze` educational asset analysis endpoint

## Deploy from the Vercel dashboard

1. Open Vercel and create a new project.
2. Select this folder as the project root:

```text
C:\Users\Hecto\Equipo de Marketing\investment-copilot-vercel
```

3. Framework preset: `Other`.
4. Build command: leave empty.
5. Output directory: leave empty.
6. Deploy.

## Deploy from the CLI

First authenticate with Vercel:

```bash
npx vercel login
```

Then deploy a preview:

```bash
npx vercel
```

Deploy production:

```bash
npx vercel --prod
```

If using a Vercel token instead of browser login:

```bash
npx vercel --token YOUR_VERCEL_TOKEN
npx vercel --prod --token YOUR_VERCEL_TOKEN
```

## Local development

```bash
npm.cmd install
npm.cmd run dev
```

## API example

```bash
curl -X POST https://your-domain.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"profile\":\"balanced\",\"asset\":{\"symbol\":\"VOO\",\"name\":\"Vanguard S&P 500 ETF\",\"type\":\"ETF\",\"trend\":\"UP\",\"volatility\":32,\"liquidity\":95,\"diversification\":92,\"valuation\":61,\"momentum\":72,\"yieldQuality\":58,\"dataQuality\":\"sample\",\"timeHorizon\":\"5+ years\",\"risks\":[\"Market drawdowns\",\"Concentration risk\"]}}"
```

## Important

This backend provides educational decision support only. Do not add trade execution, guaranteed-return language, or fixed-income claims.
