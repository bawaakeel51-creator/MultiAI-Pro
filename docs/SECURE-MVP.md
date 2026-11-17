# Secure Gemini chat MVP — review checkpoint

Base: 9855861. Local branch: feature/secure-gemini-mvp. No remote writes, deployment, merging, billing changes or live Gemini calls performed. The reported existing Cloudflare secret and Hello World Worker were not accessed or changed.

## Architecture
Static GitHub Pages UI → Cloudflare Worker → singleton SQLite Durable Object quota reservation → Gemini REST. SQLite Durable Objects support the Workers Free plan; actual account eligibility and Gemini free-tier/model availability must be checked before deployment. No paid fallback.

Authentication is invite-only bearer token authentication, not Google login or public signup. Issue a distinct cryptographically random 32-byte base64url token per user. Only SHA-256 token hashes map to stable user IDs in the encrypted AUTH_TOKEN_HASHES Worker secret. Maximum 20 invites. Keep IDs stable during rotation so quotas cannot reset; remove old token hashes to revoke. Tokens have no automatic expiry; owner revocation is required. Tokens are memory-only in UI and must never be pasted into untrusted endpoints. Never use GEMINI_API_KEY as a login token.

Limits are hard-coded: 3/user/fixed UTC minute, 20/user/UTC day, 100/global/UTC day, 10 alternating conversation messages, 2,000 characters/message, 8,000 total input characters and 512 output tokens. Reservations happen transactionally before any provider call; failed calls consume quota deliberately. Fixed minute windows permit boundary bursts; daily caps still apply. Stable per-user records and one global record persist across Worker restarts. No prompts, raw tokens or model responses are stored by this code. Revoked user counter records remain in the quota object; retained data consists only of pseudonymous IDs and counters.

CORS requires an exact configured origin, including on API clients. CORS is not authentication. GitHub Pages repositories share an origin: for broader rollout use a dedicated trusted domain. Input/output is plain text, no HTML execution. Provider errors are sanitized, request streams are size-bounded, provider timeout 20 seconds, no retries, redirects rejected. Quota/storage/config failure fails closed. AI_ENABLED is false and model blank by default; configuring secrets alone cannot enable AI.

## Verified retry results — 16 November 2026
- Existing 10 backend tests preserved; with 6 new UI/security tests, 16/16 PASS.
- Syntax and diff checks PASS. Production Worker/UI source and wrangler.toml unchanged during retry.
- Local Miniflare/workerd PASS: AI OFF, bearer authentication, malformed input rejection, real SQLite Durable Object concurrency (3 accepted out of 20 simultaneous reservations), global daily cap, and counters persisted across runtime disposal/restart.
- All runtime outbound access is blocked by a test-only outbound service. Only dummy authentication material is used; no real Gemini calls or secrets.
- Runtime uses installed Miniflare 4.20260730.0 and matching workerd with compatibility date 2026-07-30. Production config retains 2026-11-01. Exact current Cloudflare runtime parity is PENDING; do not treat this local run as a deployed smoke test.
- Alternative LinkeDOM UI tests PASS: invalid endpoint rejection, HTML output escaping, memory clearing on signout, AI-OFF error, stale-reply rejection and duplicate-submit prevention. Static checks cover viewport, responsive media rule, focus style, accessible labels/status and 44px button target. These do not prove rendered mobile layout.
- Actual visual/browser QA at 320/375/768px: PENDING. Local Chromium still fails with `socket() failed: Operation not permitted`; cloud browser could not reach workspace localhost (`ERR_CONNECTION_REFUSED`). No permission escalation or public publishing was used.
- Dependency audit PASS: zero known vulnerabilities after test-only transitive undici/sharp overrides. Lockfile and raw audit report included. No production npm dependencies added.
- Confirmed Worker name: `multiai-pro-api`. Existing remote Worker configuration and encrypted secrets were not accessed or altered.

## Reproduce locally
Use Node 22+ with a supported current patch release:
```
npm ci
npm test
npm run check
npm run test:runtime
npm audit
```
The local runtime suite uses temporary SQLite storage and removes it afterward. There are no Cloudflare login, deploy or live-provider commands in these scripts. The original 10 tests use injected mock providers; the runtime suite leaves AI OFF throughout.

## Exact next steps
1. Review files locally. Run `npm test` and `npm run check`. Use Node 22+.
2. In an environment with a working browser, verify rendered UI, keyboard use and overflow at 320/375/768px. Local Worker integration and persistence checks have passed; verify exact current production compatibility date in a current local runtime before release. No live Gemini request required. Review existing Cloudflare migrations before applying v1 to avoid a migration tag collision.
3. Worker identity is confirmed as `multiai-pro-api`. Before approval, check the dashboard account, free plan, existing encrypted key without displaying it, selected free-tier Gemini model, allowed frontend origin and existing Worker migrations/configuration.
4. After explicit deployment approval only: bind the SQLite Durable Object, set encrypted AUTH_TOKEN_HASHES, retain GEMINI_API_KEY, set the verified model; deploy with AI_ENABLED=false. No automated deploy workflow exists.
5. After separate live-call approval: temporarily enable AI for one invited owner and perform one bounded smoke test. Disable immediately afterward unless ongoing use is approved. Do not enable billing.

## Primary references reviewed
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://ai.google.dev/api/generate-content
