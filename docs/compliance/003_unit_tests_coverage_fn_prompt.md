@~/.claude/prompts/new_functionality_prompt_spec.md

# Add Unit Tests and Coverage Report for Domain Logic

## Role
Act as a Software Developer with expertise in TypeScript testing, Jest/Vitest, and code coverage tooling for Next.js applications.

## Context
Project: Sports Betting System (`gambling`) — Next.js 16 / TypeScript / MongoDB.  
Location: `D:\Master-IA-Dev\04-Bloque4\1-4-180-gambling\gambling`

Non-compliant item:
- `cq_cobertura_alta` — Only Playwright E2E tests exist. No unit tests for domain logic. No coverage report (target: >60% domain coverage).

Domain logic files that must be unit-tested:
- `lib/payout.ts` — Proportional payout algorithm (core business logic)
- `lib/auth.ts` — JWT sign/verify helpers
- `lib/redsys.ts` — HMAC-SHA256 form builder and IPN signature verifier

## Task
1. Install Jest + ts-jest (or Vitest) and `@types/jest` as devDependencies.
2. Configure the test runner in `package.json` (`jest.config.ts` or `vitest.config.ts`).
3. Enable coverage collection with Istanbul/V8 (`--coverage` flag).
4. Write unit tests in `tests/unit/`:
   - `lib/payout.test.ts` — test cases:
     - Normal proportional payout (two winners, one loser)
     - Full refund when no winners (winnersPot === 0)
     - Single winner receives entire pot
     - `Math.floor` rounding verified
   - `lib/auth.test.ts` — test cases:
     - `signToken` returns a JWT with correct payload
     - `verifyToken` returns decoded payload for valid token
     - `verifyToken` throws for expired token
     - `verifyToken` throws for tampered token
   - `lib/redsys.test.ts` — test cases:
     - `buildRedsysForm` returns fields with correct merchant params
     - `verifyNotification` returns true for valid HMAC signature
     - `verifyNotification` returns false for tampered signature
5. Add `test:unit` script to `package.json`: `jest --coverage` (or `vitest run --coverage`).
6. Add coverage badge or report link to README.
7. Commit all changes.

### Guidelines
- Mock MongoDB (`lib/db.ts`) and Nodemailer (`lib/mail.ts`) — do NOT hit real services in unit tests
- Unit tests must run offline (no network, no MongoDB, no Mailhog)
- Target: >60% line coverage on `lib/` directory
- Separate test command: `npm run test:unit` for unit tests, `npm run test:e2e` for Playwright

## Output Format
- `jest.config.ts` (or `vitest.config.ts`) at project root
- `tests/unit/lib/payout.test.ts`
- `tests/unit/lib/auth.test.ts`
- `tests/unit/lib/redsys.test.ts`
- Updated `package.json` with `test:unit` script
- Coverage output in `coverage/` directory (gitignored)
- Updated `README.md` with `npm run test:unit` command and coverage summary
- Git commit: `test: add unit tests for payout, auth, and redsys with coverage`

## Output Checklist and Guardrails
- [ ] `npm run test:unit` runs and all tests pass
- [ ] Coverage report shows >60% lines on `lib/payout.ts`, `lib/auth.ts`, `lib/redsys.ts`
- [ ] No unit tests hit real MongoDB or network endpoints
- [ ] `npm run test:e2e` still works (Playwright unchanged)
- [ ] `coverage/` directory is in `.gitignore`
- [ ] README updated with unit test command
- [ ] Changes committed
