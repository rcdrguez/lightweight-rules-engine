# Lightweight Rules Engine Playground (Next.js 14)

SaaS-style demo playground for creating, testing, and explaining business decision rules.

## Run

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` to connect to an API implementing:
- `GET /health`
- `POST /evaluate`
- `POST /validate`
