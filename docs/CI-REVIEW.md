# Pre-release audit

## 18 November 2026

GitHub Actions run 44269121120 on 704d6d397911a8b5f85025dbfa50616cc1e1bd71 passed all 18 tests, runtime validation, audit and 19 digests. The log reports two Node 20 actions and DEP0040 during setup-node. The follow-up pins Node 24 actions, keeps Node 22 for project tests and disables automatic package-manager caching. A new hosted run must confirm warnings after this change.

Local follow-up covers an in-flight reply clearing an edited draft, private draft cleanup on session replacement and actionable handling of long assistant history. Firefox tested 320, 375, 768 and 1440 CSS pixels with mocked responses. Axe found no automated violations on the initial screen at these sizes. Local UI-to-workerd validation covered preflight and an authenticated AI-disabled response. Physical devices and assistive-technology speech remain unverified.

Cloudflare dashboard, read-only: production workers.dev URL enabled for multiai-pro-api.bawaakeel51.workers.dev, previews disabled, no custom domains or zone routes, zero resource bindings, compatibility date 2026-11-05. Settings showed an encrypted provider key. Repository specifies workers_dev=false, compatibility date 2026-11-01 and QUOTAS with a v1 SQLite migration. Remote migration tag history and a production authenticated chat transaction remain unverified. Resolve routing, bindings, auth configuration and migration compatibility before deployment approval.

## Historical checkpoint — 17 November 2026

Baseline: eff2b89bc06ef6f7b462075681eea146db09283d on Draft PR #1, feature/secure-gemini-mvp. main remains 985586138f236218999c29e85964236695628bec. Earlier work and the checksum fix were preserved; intended changed-file digests are regenerated after validation. Local results below do not imply a remote commit or deployment.

## Fixed locally
- A stale request timer closed over the mutable global controller and could abort a new signed-in session. The timer/fetch now use a request-local controller. Mock regression failed before and passes after.
- Content-Type prefix matching accepted application/jsonp and rejected valid mixed-case JSON. Exact media-type parsing now accepts Application/JSON with parameters and rejects lookalikes before quota/provider access. Regression failed before and passes after.
- Runtime QA hard-coded July instead of production November. Pin test-only workerd 1.20261117.1, read 2026-11-01 directly from Wrangler config, reject an older runtime before launch, retain the test-only frozen clock and strict restart assertions. No date downgrade or deployment.

## Verified local PASS
- Node 22: 18/18 unit/DOM tests, syntax checks, local workerd SQLite concurrency/global cap/restart tests, npm audit (zero reported vulnerabilities).
- Firefox rendered the actual local index.html/app.js/styles.css through an intercepted HTTPS QA origin at 320/375/768px. All other requests were blocked or locally mocked. No source injection or live AI. No horizontal overflow; visible keyboard focus/Tab; Enter expands access settings; 44px button targets (rounded subpixel bounds); empty/invalid access/AI-OFF states; mock XSS text rendering; long-response scrolling; signout state clearing; zero page errors.
- V1 preservation: docs/v1-preview.html byte-for-byte matches index.html at main 9855861 (SHA-256 5ef615d744c82f4a7b4b1f962c2f901eb6b6bf1d6305b66b13cb7060a7037503).
- Production config retains AI_ENABLED=false, blank model and workers_dev=false. Dummy tokens and mocked providers only.

## Security and workflow review
Invite-only random bearer tokens are hashed server-side and kept in UI memory; owner revocation required, no automatic expiry/public signup. Missing/invalid/revoked authentication is rejected. Stable user IDs must survive rotation. Never use the provider key as an access token or enter tokens into untrusted endpoints.

CORS uses exact origins and no cookies/wildcards; CORS is not authentication. GitHub Pages shares the account origin across repositories. Prefer a dedicated trusted frontend origin before wider rollout. Plain-text DOM rendering prevents model HTML execution. CSP avoids inline script/eval. Request bodies are byte-bounded; input lengths and roles validated; provider output and tokens bounded; redirects rejected; sanitized errors; no prompts/tokens/responses stored. The 2000-character per-message and 8000-total conversation limits also apply to submitted assistant history; large replies can require a fresh conversation.

Singleton SQLite Durable Object reserves quotas transactionally before provider calls: 3/user/fixed minute, 20/user/UTC day, 100/global/UTC day. Failed calls consume quota; fixed windows allow boundary bursts. This is an invite-only application quota, not an upstream DDoS shield. Storage/config failures fail closed.

CI remains Node 22, SHA-pinned checkout/setup-node, contents:read, persist-credentials:false, no secrets, no pull_request_target, 10-minute timeout, cancellation of superseded runs. Commands: checksum validation, npm ci, npm test, npm run check, npm run test:runtime, npm audit, checksum validation. npm audit may also fail if registry access is unavailable. Checksums cover every tracked file except the manifest; they are consistency checks, not signatures. Review manifest edits with code.

## Pending / blocked
- Connected browser reports originating browser context unavailable. No Cloudflare connector is available. Remote multiai-pro-api account, bindings, routes, custom domains, preview URLs and migration history were not inspected.
- Local v1 migration uses new_sqlite_classes=["QuotaGate"] and binding QUOTAS. Local SQLite behavior passed; it does not establish that v1 is unused or compatible with the existing deployed Worker. Check remote migrations before any approved deployment; do not invent or overwrite tags.
- workers_dev=false disables the production workers.dev endpoint; no repository route/custom domain is declared. A dashboard-managed route may exist. Read-only dashboard review must determine the actual frontend endpoint before changing anything. If none exists, separately approve either workers.dev exposure or a verified owned domain/zone route. Inspect preview exposure independently; prefer explicit preview_urls=false unless intentionally approved. No routing changes made.
- Physical Android/iOS, screen-reader behavior and full WCAG conformance are unverified; Firefox responsive checks are not device certification.
- Any new changes need a feature-branch commit and fresh successful GitHub CI before they can be called PR-verified. Do not reuse eff2b89 CI as evidence for a later head.

Keep PR DRAFT, AI OFF, main unchanged. No live Gemini calls, billing, merge, release, production publishing or deployment.

References:
- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
- https://docs.github.com/en/actions/reference/security/secure-use
