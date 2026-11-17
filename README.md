# MultiAI-Pro
Multi-model AI assistant with smart chat, coding, research, AI comparison and productivity tools.

## Secure chat MVP (local review)

Invite-only Gemini chat code is prepared with AI disabled by default. Existing V1 is preserved in `docs/v1-preview.html`. See [setup, limits and approval gates](docs/SECURE-MVP.md).

Run with Node 22+: `npm test` and `npm run check`. No build step or runtime npm dependency is required. Static UI files: `index.html`, `app.js`, `styles.css`. Worker: `worker/index.js`. Configuration: `wrangler.toml`.

Do not put secrets in static files, source control, URLs or screenshots. No deployment/publishing/merge or live API request is authorized by this code checkpoint.

Retry QA: 16/16 tests and local SQLite Durable Object runtime checks PASS. Run `npm ci`, `npm test`, `npm run check`, `npm run test:runtime` and `npm audit`. Dev-only test dependencies are lockfile-pinned; production remains dependency-free. Rendered mobile/browser QA remains pending due environment access restrictions.
