# ADR-002: JWT in localStorage Instead of HttpOnly Cookies

## Status
Accepted

## Context
The spec explicitly states: **"No usar cookies."** However, the choice still has security implications worth documenting.

Two common approaches for storing session tokens in Next.js:

| Approach | XSS Risk | CSRF Risk | SSR Access | Complexity |
|---|---|---|---|---|
| `HttpOnly` cookie | Low (JS cannot read) | Medium (requires CSRF token) | Yes (sent automatically) | Higher (cookie config, CSRF middleware) |
| `localStorage` + `Authorization` header | Medium (XSS can read) | None (not sent automatically) | No (client-only) | Lower |

For this project (local dev, magic-link auth, no third-party embeds), the CSRF risk of cookies is the more likely attack vector in a betting context. An attacker who can inject malicious forms or cross-origin requests could trigger bet placements using a victim's cookie without knowing the token value. With `localStorage`, the attacker would need XSS to extract the token first.

## Decision
Store the session JWT in `localStorage`. All authenticated API calls include the token as `Authorization: Bearer <jwt>`. The server reads `request.headers.get('authorization')` — never a cookie.

- Magic tokens (15-min expiry) are single-use, stored in MongoDB, marked `used: true` on first consumption.
- Session tokens (7-day expiry) are stateless JWTs verified on every request with `jsonwebtoken`.
- No server-side session store required (simplifies deployment).

## Consequences

**Positive:**
- Zero CSRF surface — no cookie = no cross-origin form exploits
- Simpler API architecture — stateless, no session middleware
- Easy to implement role-aware routing in the client (`AppContext` decodes the JWT)

**Negative:**
- `localStorage` is readable by JavaScript on the same origin → XSS can steal the token
- Token cannot be revoked before expiry (no server-side blacklist)
- Server-side rendering cannot access the token (pages render without auth context on first paint)

**Trade-offs:**
- Acceptable for this application: no third-party scripts, no iframe embeds, CSP can be configured to limit XSS vectors. A production upgrade path would be to migrate to `HttpOnly` cookies with CSRF tokens and add a token revocation list in Redis.
