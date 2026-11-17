# Draft PR #1 CI and security review — 17 November 2026

Reviewed baseline 2bca65586740c451a38088e1550c644a063c2aeb, including its correct runtime checksum. Existing production Worker, UI, lockfile and Wrangler configuration are preserved. No main update, merge, deployment, billing or live Gemini request.

## Changes
- Node 22 GitHub Actions job runs on feature branch pushes and PRs targeting main, including drafts. Uses immutable action SHAs, contents:read, no persisted credentials, no secrets, no deployment, 10-minute timeout and cancellation of superseded runs. No pull_request_target event.
- Runs checksum validation, npm ci, npm test, npm run check, npm run test:runtime, npm audit and checksum validation again. npm audit fails on reported vulnerabilities; audit availability is also a CI dependency.
- Checksum verifier requires exact coverage of every tracked file except the manifest itself. It detects changes and missing/new unlisted files; it is a consistency check, not a signature. Review manifest changes alongside code.
- Fixed a real runtime-test flake: wall-clock minute/day transitions could change burst/global-cap assertions. A test-only frozen Date.now is prepended to the in-memory Worker source; production code is untouched. Restart now strictly asserts 429 instead of permitting either status. Updated runtime checksum intentionally; baseline checksum fix was verified before changes.

## Validation
Node v22.23.5: npm ci, 16/16 tests and syntax checks PASS. Runtime and audit results are recorded in the PR after final checks. No real provider requests; unit tests inject mocks and the local runtime blocks all outbound calls with AI OFF.

Authentication: invite-only per-user SHA-256 bearer-token hashes; malformed, absent and revoked tokens rejected. UI retains token in memory, clears it on signout and ignores stale responses. Tokens need owner revocation; automatic expiry and public signup are absent by design. Only use owner-approved Worker endpoints.

CORS: exact origin matching, no wildcard or cookies; missing/hostile origins rejected. CORS is not an authentication boundary. The configured GitHub Pages origin is shared by all repositories under that account; use a dedicated trusted frontend origin before broader rollout.

Quotas: transactional singleton SQLite Durable Object reserves 3/user/minute, 20/user/day, 100/global/day before provider calls, with persistence and concurrency checks. Failed calls consume quota intentionally. Fixed windows permit boundary bursts; rotation must retain stable user IDs. This is not an upstream DDoS shield.

Mobile/accessibility: labels, live status/log, password field, visible focus, 44px buttons, wrapping and narrow-screen CSS are present; DOM tests cover escaping, duplicate submits and signout. Rendered 320/375/768px, full keyboard and screen-reader QA remain PENDING: local Chromium launch is blocked by socket() Operation not permitted. Do not infer visual PASS from static tests.

Runtime: local Miniflare/workerd uses 2026-07-30, while wrangler.toml declares 2026-11-01. SQLite DO behavior passed locally; exact production-date compatibility remains PENDING. Keep this explicit rather than silently lowering the production date or claiming deployment parity. Before release, use a supported current runtime at the declared date and review remote migrations for a v1 tag collision.

## Routing recommendation — no config change or deployment
workers_dev=false disables the production workers.dev URL. The repository declares no route or custom domain. This does not prove the dashboard lacks a separately managed route; remote Cloudflare account/settings have not been accessed.

Before a separately approved deployment, confirm the existing Worker account/name (multiai-pro-api) and dashboard Domains & Routes. Choose either an approved workers.dev endpoint (set workers_dev=true) or keep false and configure a verified custom domain/zone route for /api/chat. Do not invent a domain or zone ID. Review preview URL exposure too; prefer explicit preview_urls=false unless previews are intentionally approved. Retain AI_ENABLED=false and blank model until their separate approvals. A route alone does not enable Gemini.

References:
- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://docs.github.com/en/actions/reference/security/secure-use
