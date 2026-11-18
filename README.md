# MultiAI-Pro
Multi-model AI assistant with smart chat, coding, research, AI comparison and productivity tools.

## Secure chat MVP (local review)

Invite-only Gemini chat code is prepared with AI disabled by default. Existing V1 is preserved in `docs/v1-preview.html`. See [setup, limits and approval gates](docs/SECURE-MVP.md).

Run with Node 22+: `npm test` and `npm run check`. No build step or runtime npm dependency is required. Static UI files: `index.html`, `app.js`, `styles.css`. Worker: `worker/index.js`. Configuration: `wrangler.toml`.

Do not put secrets in static files, source control, URLs or screenshots. No deployment/publishing/merge or live API request is authorized by this code checkpoint.

The [pre-release audit](docs/CI-REVIEW.md) records local tests, GitHub CI evidence, accessibility coverage and the differences between the proposed configuration and the live Worker.

Run `npm ci`, `npm test`, `npm run check`, `npm run test:runtime`, `npm audit` and `node qa/verify-checksums.mjs`. Dev-only dependencies are lockfile-pinned; production remains dependency-free. AI is OFF. No deployment workflow exists.
