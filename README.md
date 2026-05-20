# Sports Betting System — Gambling App

A **Next.js 16 / React 19 full-stack web application** that implements a complete sports betting platform with real payment processing, magic-link authentication, and proportional payout distribution.

---

## Features Implemented

### 1. Magic Link Authentication
Passwordless login via JWT-signed email links. Users request a link at `/login`, receive it through Mailhog (local SMTP), click it, and get a 7-day session JWT stored in `localStorage`. No cookies are used.

- Token expires in 15 minutes; single-use enforced via MongoDB flag.
- Session JWT payload: `{ userId, email, role }`.
- Admin vs user role separation enforced on every API route.

### 2. Sports Betting & Payout Engine
Users browse open matches, pick a side (`team1` / `team2` / `draw`), and place a real money bet via REDSYS TPV virtual (test mode).

- Match lifecycle: `open → closed → settled`.
- Payout algorithm distributes the total pot proportionally among winners:
  ```
  payout(bet) = (bet.amountCents / winnersPot) * totalPot
  ```
- If no winners exist, all bets are fully refunded (`status: 'refunded'`).
- All monetary values stored in **cents** (integer arithmetic, `Math.floor`).

### 3. REDSYS Payment Integration
HMAC-SHA256 signed form submission to REDSYS TPV virtual (test environment), with IPN callback validation.

- Generates a unique `redsysOrderId` per bet.
- IPN endpoint `POST /api/payments/notify` validates the merchant signature before activating a bet.
- Redirects to `/payments/ok` or `/payments/ko` after the payment flow.

---

## Project Structure

```
gambling/
├── app/
│   ├── page.tsx                    — Home: list of open matches
│   ├── layout.tsx                  — Root layout with Navbar and dark theme
│   ├── globals.css                 — Global styles (dark theme, green accent)
│   ├── login/page.tsx              — Magic link request form
│   ├── auth/verify/page.tsx        — Processes token from URL, starts session
│   ├── matches/[id]/page.tsx       — Match detail + bet form
│   ├── my-bets/page.tsx            — User bet history and balance
│   ├── payments/ok/page.tsx        — Payment success confirmation
│   ├── payments/ko/page.tsx        — Payment failure page
│   ├── admin/
│   │   ├── page.tsx                — Admin dashboard
│   │   ├── matches/page.tsx        — Manage all matches
│   │   ├── matches/new/page.tsx    — Create a new match
│   │   ├── matches/[id]/page.tsx   — Edit match / declare result
│   │   └── users/page.tsx          — User management
│   └── api/
│       ├── auth/request/route.ts   — POST: generate and email magic link
│       ├── auth/verify/route.ts    — GET: validate token, return session JWT
│       ├── matches/route.ts        — GET (list) / POST (create) matches
│       ├── matches/[id]/route.ts   — PATCH: update status / declare result
│       ├── bets/route.ts           — GET (history) / POST (place bet + REDSYS)
│       ├── payments/notify/route.ts — POST: REDSYS IPN with HMAC validation
│       └── admin/
│           ├── users/route.ts      — GET: list all users (admin only)
│           └── reports/route.ts    — GET: betting and payment summary
├── lib/
│   ├── types.ts                    — TypeScript interfaces (Match, Bet, User, MagicToken)
│   ├── db.ts                       — MongoDB singleton client
│   ├── auth.ts                     — JWT sign/verify helpers
│   ├── mail.ts                     — Nodemailer + Mailhog transport
│   ├── payout.ts                   — Proportional payout calculation
│   └── redsys.ts                   — REDSYS HMAC-SHA256 form builder & IPN verifier
├── components/
│   └── Navbar.tsx                  — Responsive navigation with role-aware links
├── context/
│   └── AppContext.tsx              — React context for session state
├── scripts/
│   └── seed.ts                     — DB seeder (admin + 3 users + 3 matches + bets)
├── tests/e2e/
│   ├── auth.spec.ts                — Magic link full flow via Mailhog
│   ├── bet-flow.spec.ts            — Login → match → bet → REDSYS → confirmation
│   ├── admin-match.spec.ts         — Create → close → settle → verify payouts
│   └── my-bets.spec.ts             — Bet history and updated balance
├── playwright.config.ts            — Playwright config with webServer (npm run dev)
├── next.config.ts                  — Next.js configuration
└── .env.local                      — Environment variables (not committed)
```

---

## Design Patterns & Architecture

- **Singleton (MongoDB client)** — `lib/db.ts` exports a single `MongoClient` instance reused across serverless function invocations to avoid connection exhaustion.
- **Repository-style API routes** — each `route.ts` file handles a single resource; business logic delegated to `lib/` helpers, keeping routes thin.
- **Strategy pattern (payout)** — `lib/payout.ts` encapsulates the payout algorithm separately from the bet lifecycle, making it independently testable and replaceable.
- **Context + localStorage session** — `context/AppContext.tsx` holds the decoded JWT and exposes it app-wide; no server-side session state.
- **HMAC signature validation** — `lib/redsys.ts` implements the REDSYS HMAC-SHA256 protocol as a pure utility, keeping cryptographic concerns isolated.

---

## How It Works

1. A user requests a magic link → the server mints a short-lived JWT and sends it via Mailhog → clicking the link exchanges it for a 7-day session token stored in `localStorage`.
2. The user picks a match, selects their outcome, and submits the bet → the server creates a `pending` bet and renders a REDSYS payment form → after payment, REDSYS posts an IPN to `/api/payments/notify` which validates the HMAC and activates the bet.
3. When an admin declares the match result, the payout engine runs: winning bets receive `(amountCents / winnersPot) * totalPot` credited to `user.balanceCents`; losing bets are marked `lost`; if there are no winners, everyone gets refunded.

```ts
// lib/payout.ts — core distribution logic
export function calculatePayouts(bets: Bet[], result: MatchResult) {
  const winners = bets.filter(b => b.pick === result);
  const totalPot = bets.reduce((s, b) => s + b.amountCents, 0);
  const winnersPot = winners.reduce((s, b) => s + b.amountCents, 0);

  if (winnersPot === 0) {
    return bets.map(b => ({ ...b, status: 'refunded', payoutCents: b.amountCents }));
  }

  return bets.map(b =>
    b.pick === result
      ? { ...b, status: 'won', payoutCents: Math.floor((b.amountCents / winnersPot) * totalPot) }
      : { ...b, status: 'lost', payoutCents: 0 }
  );
}
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB running locally on port `27017`
- Mailhog running locally (SMTP `1025`, UI `8025`)
- Docker (optional, for Mailhog)

### Clone & Install

```bash
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-180-gambling.git
cd MISEIA_1-4-180-gambling
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=gambling
JWT_SECRET=magik-link-dev-secret-2026
MAILHOG_HOST=localhost
MAIL_PORT=1027
MAIL_FROM=noreply@gambling.local
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=1
REDSYS_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7
REDSYS_URL=https://sis-t.redsys.es:25443/sis/realizarPago
REDSYS_NOTIFICATION_URL=http://localhost:3000/api/payments/notify
REDSYS_OK_URL=http://localhost:3000/payments/ok
REDSYS_KO_URL=http://localhost:3000/payments/ko
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Seed the Database

```bash
npm run seed
```

Creates:
- `admin@gambling.local` (role: admin)
- `alice@gambling.local`, `bob@gambling.local`, `carol@gambling.local` (role: user)
- 3 matches: Real Madrid vs Barcelona (`open`), Atlético vs Sevilla (`settled`), PSG vs Bayern (`closed`)

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). View magic link emails at [http://localhost:8025](http://localhost:8025) (Mailhog UI).

### Run E2E Tests

```bash
npm run test:e2e
```

Playwright spins up `npm run dev` automatically and runs all specs in `tests/e2e/`.

---

## Example Flows

**Successful bet with payout:**
```
User alice bets €10 on team1 (1000 cents)
User bob   bets €5  on team1 ( 500 cents)
User carol bets €15 on team2 (1500 cents)

→ Admin declares result: team1
→ totalPot   = 3000 cents
→ winnersPot = 1500 cents
→ alice payout = (1000/1500) * 3000 = 2000 cents (€20.00) ✓
→ bob   payout =  (500/1500) * 3000 = 1000 cents (€10.00) ✓
→ carol payout = 0 (lost) ✗
```

**Full refund (no winners):**
```
User alice bets €20 on draw
User bob   bets €10 on draw

→ Admin declares result: team1
→ winnersPot = 0 → all bets refunded
→ alice: status=refunded, payout=2000 cents ✓
→ bob:   status=refunded, payout=1000 cents ✓
```

**Magic link authentication:**
```
POST /api/auth/request   { email: "alice@gambling.local" }
→ JWT minted (exp 15min), email sent via Mailhog

GET  /api/auth/verify?token=<jwt>
→ Token validated, marked used, 7-day session JWT returned
→ Stored in localStorage, user redirected to /
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Database | MongoDB 7 |
| Auth | JWT (jsonwebtoken) + Magic Links |
| Email | Nodemailer + Mailhog |
| Payments | REDSYS TPV Virtual (test) |
| Testing | Playwright |
| Language | TypeScript 5 |
