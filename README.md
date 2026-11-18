# MultiAI-Pro
Multi-model AI assistant with smart chat, coding, research, AI comparison and productivity tools.

## Secure chat MVP (local review)

Invite-only Gemini chat code is prepared with AI disabled by default. Existing V1 is preserved in `docs/v1-preview.html`. See [setup, limits and approval gates](docs/SECURE-MVP.md).

Run with Node 22+: `npm test` and `npm run check`. No build step or runtime npm dependency is required. Static UI files: `index.html`, `app.js`, `styles.css`. Worker: `worker/index.js`. Configuration: `wrangler.toml`.

Do not put secrets in static files, source control, URLs or screenshots. No deployment/publishing/merge or live API request is authorized by this code checkpoint.

Final local audit: 18/18 tests PASS, with local SQLite Durable Object runtime checks at production `compatibility_date = "2026-11-01"` using test-only workerd 1.20261117.1. Rendered Firefox QA passed at 320/375/768px, including keyboard focus, overflow, forms, mock error/response states and signout. Actual Cloudflare dashboard routes/migrations and assistive-technology/device testing remain pending. See [current audit evidence and blockers](docs/CI-REVIEW.md).

Run `npm ci`, `npm test`, `npm run check`, `npm run test:runtime`, `npm audit` and `node qa/verify-checksums.mjs`. Dev-only dependencies are lockfile-pinned; production remains dependency-free. AI is OFF. No deployment workflow exists.
