# Security Notes (WIP)

This repository currently prioritizes functionality and iteration speed. The items below capture security context and intended future hardening steps.

## CORS is not security

- CORS is a browser-enforced policy.
- Lack of CORS configuration can prevent **browser-based** cross-origin JavaScript from reading responses / completing preflight.
- CORS does **not** prevent:
  - `curl` / Postman
  - mobile apps
  - backend services
  - any non-browser HTTP client

Therefore, CORS should not be relied on for access control.

## Goal: users API must not be called from client-side code

The goal is:

- The public frontend should **not** call `mvp/api/users` directly.
- Consumers should call via a server-side integration (SDK used from a backend / BFF).

## Recommended architecture (BFF / gateway)

- Frontend (browser) calls your **backend** (BFF/API gateway) only.
- Backend calls internal services (like `users`) using server credentials.
- Ideally, internal services are not publicly reachable.

## API-level enforcement (actual security)

To enforce “server-only” usage, the `users` API must require secrets that are never shipped to browsers.

Recommended options:

- Put `users` behind a private network / internal routing (best).
- Require server-to-server auth on all `users` endpoints:
  - mTLS (strongest)
  - Service JWT (signed by a trusted issuer)
  - Shared secret / API key (simpler)
- Consider edge hardening if the service must be public:
  - IP allowlisting (only your backend/gateway)
  - WAF + rate limits

## SDK-level guardrails (developer experience)

SDK-side measures do not provide strong security by themselves, but they prevent accidental misuse.

### Runtime guard

Add a runtime guard that throws if the SDK is imported/constructed in a browser-like environment (e.g. `window`/`document` present).

Context:

- `mvp/rails-ts-sdk/src/lib/sdks.ts` already computes `isBrowserLike`.
- Today, it’s only used for headers (e.g. user-agent).
- Intended improvement: fail fast when `isBrowserLike` is true.

### Packaging / bundler guard

Use conditional exports so bundlers resolve a “browser” build that throws.

High-level approach:

- Add a `"browser"` condition in `package.json` `exports`.
- Point `"browser"` to a stub module that throws an explicit server-only error.

## Current state (as of now)

- The `users` service does not configure CORS middleware.
- This may block browser calls in some cases, but it is not a security boundary.
- The TypeScript SDK is currently usable in browser-like environments unless we add explicit guards.
