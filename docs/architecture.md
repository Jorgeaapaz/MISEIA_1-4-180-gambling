# Architecture — Sports Betting System

## System Overview

```mermaid
graph TD
    Browser["🌐 Browser (React 19)"]
    NextJS["⚡ Next.js 16 App Router\n(API Routes + Pages)"]
    MongoDB["🗄️ MongoDB 7\n(gambling db)"]
    Mailhog["📧 Mailhog\n(SMTP :1025 / UI :8025)"]
    REDSYS["💳 REDSYS TPV Virtual\n(test gateway)"]

    Browser -->|"HTTP / localStorage JWT"| NextJS
    NextJS -->|"MongoClient singleton\nlib/db.ts"| MongoDB
    NextJS -->|"Nodemailer\nlib/mail.ts"| Mailhog
    NextJS -->|"HMAC-signed form POST\nlib/redsys.ts"| REDSYS
    REDSYS -->|"IPN POST /api/payments/notify\nHMAC validated"| NextJS
```

## Match Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> open : Admin creates match
    open --> closed : Admin closes betting
    closed --> settled : Admin declares result
    settled --> [*]

    open : open\n(bets accepted)
    closed : closed\n(no new bets)
    settled : settled\n(payouts distributed)
```

## Authentication Flow (Magic Link)

```mermaid
sequenceDiagram
    actor User
    participant Next as Next.js API
    participant Mongo as MongoDB
    participant MH as Mailhog

    User->>Next: POST /api/auth/request {email}
    Next->>Mongo: Find or create user
    Next->>Next: Sign JWT (exp 15min, type=magic)
    Next->>Mongo: Store MagicToken {token, userId, expiresAt}
    Next->>MH: Send email with verify link
    MH-->>User: Email with link

    User->>Next: GET /api/auth/verify?token=<jwt>
    Next->>Next: Verify JWT + type=magic
    Next->>Mongo: Find token, check used=false
    Next->>Mongo: Mark token used=true
    Next->>Next: Sign session JWT (exp 7d, {userId, email, role})
    Next-->>User: { token: sessionJWT }
    User->>User: Store in localStorage
```

## Bet & Payment Flow (REDSYS)

```mermaid
sequenceDiagram
    actor User
    participant Next as Next.js API
    participant Mongo as MongoDB
    participant TPV as REDSYS TPV

    User->>Next: POST /api/bets {matchId, pick, amountCents}
    Next->>Mongo: Create Bet {status: pending, redsysOrderId}
    Next->>Next: buildRedsysForm() → HMAC-signed params
    Next-->>User: HTML form (auto-submit to REDSYS)

    User->>TPV: Payment (test card)
    TPV->>Next: POST /api/payments/notify {Ds_MerchantParameters, Ds_Signature}
    Next->>Next: validateRedsysNotification() HMAC check
    Next->>Mongo: Find bet by orderId → mark active
    TPV-->>User: Redirect /payments/ok or /payments/ko
```

## Payout Algorithm

```mermaid
flowchart TD
    Settle["Admin: PATCH /api/matches/:id\n{result: 'team1'|'team2'|'draw'}"]
    Settle --> Fetch["Fetch all bets for match\nfrom MongoDB"]
    Fetch --> Check{winnersPot > 0?}

    Check -->|No| Refund["All bets → status: refunded\npayoutCents = amountCents\nCredit all users"]
    Check -->|Yes| CalcW["Winners: payout =\nfloor(amountCents / winnersPot × totalPot)\nstatus: won"]
    Check -->|Yes| CalcL["Losers: payoutCents = 0\nstatus: lost"]
    CalcW --> Credit["Increment user.balanceCents"]
```

## Layer Diagram

```
┌─────────────────────────────────────────────────┐
│                  Browser / UI                    │
│   React pages · AppContext · localStorage JWT    │
└───────────────────────┬─────────────────────────┘
                        │ HTTP fetch + Auth header
┌───────────────────────▼─────────────────────────┐
│              Next.js API Routes (app/api/)        │
│  /auth/request  /auth/verify  /matches  /bets    │
│  /payments/notify  /admin/users  /admin/reports  │
└────┬──────────────┬──────────────┬──────────────┘
     │              │              │
┌────▼────┐   ┌─────▼─────┐  ┌───▼──────────┐
│  lib/   │   │  lib/     │  │  lib/        │
│  auth   │   │  payout   │  │  redsys      │
│  (JWT)  │   │  (settle) │  │  (HMAC form) │
└────┬────┘   └─────┬─────┘  └──────────────┘
     │              │
┌────▼──────────────▼─────────────────────────────┐
│             lib/db.ts  (MongoDB Singleton)        │
│         MongoClient · gambling database          │
│   users · matches · bets · magic_tokens          │
└─────────────────────────────────────────────────┘
```

## Collections & Key Indexes

| Collection | Key Indexes |
|---|---|
| `users` | `{ email: 1, unique: true }` |
| `matches` | `{ status: 1 }` |
| `bets` | `{ matchId: 1 }`, `{ userId: 1 }`, `{ redsysOrderId: 1, unique: true }` |
| `magic_tokens` | `{ token: 1, unique: true }`, TTL on `expiresAt` |
