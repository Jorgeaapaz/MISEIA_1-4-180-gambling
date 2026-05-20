<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Sports Betting System — Application Specification

## Overview

Sistema de apuestas deportivas donde un administrador define partidos (equipo1 vs equipo2), los usuarios apuestan dinero real al resultado (gana equipo1, gana equipo2, o empate) y, una vez cerrado el partido, el bote total se reparte proporcionalmente entre los ganadores.

---

## Roles

| Rol   | Capacidades |
|-------|-------------|
| `admin` | Crear/editar/cerrar partidos; declarar resultado; gestionar usuarios; ver informes |
| `user`  | Ver partidos activos; realizar apuestas; consultar historial; ver saldo de cuenta |

---

## Domain Model (`lib/types.ts`)

```ts
interface Match {
  _id: ObjectId
  team1: string
  team2: string
  status: 'open' | 'closed' | 'settled'   // open=apuestas activas, closed=sin nuevas apuestas, settled=resultado declarado
  result: 'team1' | 'team2' | 'draw' | null
  createdAt: Date
  closedAt: Date | null
  settledAt: Date | null
}

interface Bet {
  _id: ObjectId
  matchId: ObjectId
  userId: ObjectId
  pick: 'team1' | 'team2' | 'draw'
  amountCents: number       // siempre en céntimos
  status: 'pending' | 'won' | 'lost' | 'refunded'
  payoutCents: number | null
  redsysOrderId: string     // identificador único de orden REDSYS
  createdAt: Date
}

interface User {
  _id: ObjectId
  email: string
  role: 'admin' | 'user'
  balanceCents: number      // saldo acumulado de premios ganados
  createdAt: Date
}

interface MagicToken {
  _id: ObjectId
  userId: ObjectId
  token: string             // JWT firmado con JWT_SECRET
  expiresAt: Date
  used: boolean
}
```

---

## Payout Algorithm

```
totalPot      = suma de amountCents de todas las apuestas del partido
winnersPot    = suma de amountCents de las apuestas ganadoras
payout(bet)   = (bet.amountCents / winnersPot) * totalPot   // proporcional
```

- Si no hay ganadores (p.ej. todos apostaron al mismo equipo equivocado) → reembolso total (`status: 'refunded'`).
- Todos los valores en céntimos; redondear a entero con `Math.floor`.

---

## Payment Gateway — REDSYS (test mode)

- Librería: `node-redsys-api` o integración manual con HMAC-SHA256.
- Credenciales de prueba (añadir a `.env.local`):

```env
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=1
REDSYS_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7
REDSYS_URL=https://sis-t.redsys.es:25443/sis/realizarPago
REDSYS_NOTIFICATION_URL=http://localhost:3000/api/payments/notify
REDSYS_OK_URL=http://localhost:3000/payments/ok
REDSYS_KO_URL=http://localhost:3000/payments/ko
```

- Flujo de pago:
  1. Usuario selecciona partido + pick + importe → `POST /api/bets` crea `Bet` con `status: 'pending'` y genera formulario REDSYS.
  2. Usuario completa pago en TPV virtual REDSYS (test).
  3. REDSYS llama `POST /api/payments/notify` (notificación IPN) → validar firma HMAC → marcar apuesta como activa.
  4. Redirigir a `/payments/ok` o `/payments/ko`.

---

## Authentication — Magic Link + JWT

Seguir exactamente las **Authentication rules** de la skill microprompt:

1. `POST /api/auth/request` → recibe `email`, genera JWT (exp 15 min), envía correo con link `http://localhost:3000/api/auth/verify?token=<jwt>` vía Mailhog.
2. `GET /api/auth/verify?token=<jwt>` → valida JWT, marca token como usado, devuelve nuevo JWT de sesión (exp 7 días), almacenar en `localStorage`.
3. JWT de sesión incluye `{ userId, email, role }`.
4. **No usar cookies.**

---

## API Routes

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/auth/request` | público | Solicitar magic link |
| GET  | `/api/auth/verify` | público | Verificar token y autenticar |
| GET  | `/api/matches` | user/admin | Listar partidos (filtro por status) |
| POST | `/api/matches` | admin | Crear partido |
| PATCH | `/api/matches/[id]` | admin | Actualizar estado / declarar resultado |
| GET  | `/api/bets` | user | Historial de apuestas del usuario |
| POST | `/api/bets` | user | Crear apuesta + iniciar pago REDSYS |
| POST | `/api/payments/notify` | público (REDSYS) | Notificación IPN REDSYS |
| GET  | `/api/admin/users` | admin | Listar usuarios |
| GET  | `/api/admin/reports` | admin | Resumen de apuestas y pagos |

---

## Pages & Components

```
app/
  page.tsx                  → Home: lista de partidos abiertos
  login/page.tsx            → Formulario magic link
  auth/verify/page.tsx      → Procesa token de URL y redirige
  matches/[id]/page.tsx     → Detalle partido + formulario apuesta
  my-bets/page.tsx          → Historial de apuestas del usuario
  payments/ok/page.tsx      → Confirmación de pago exitoso
  payments/ko/page.tsx      → Error de pago
  admin/
    page.tsx                → Dashboard admin
    matches/page.tsx        → Gestión de partidos
    matches/new/page.tsx    → Crear partido
    matches/[id]/page.tsx   → Editar / declarar resultado
    users/page.tsx          → Gestión de usuarios
```

---

## Database (`lib/db.ts`)

- Singleton `MongoClient` con `MONGODB_URI`.
- Base de datos: `gambling`.
- Colecciones: `users`, `matches`, `bets`, `magic_tokens`.
- Índices recomendados:
  - `bets`: `{ matchId: 1 }`, `{ userId: 1 }`, `{ redsysOrderId: 1, unique: true }`
  - `magic_tokens`: `{ token: 1, unique: true }`, `{ expiresAt: 1, expireAfterSeconds: 0 }` (TTL)

---

## Environment Variables (`.env.local`)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=gambling

# JWT
JWT_SECRET=magik-link-dev-secret-2026

# Email (Mailhog)
MAILHOG_HOST=localhost
MAIL_PORT=1027
MAIL_FROM=noreply@gambling.local

# REDSYS (test)
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=1
REDSYS_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7
REDSYS_URL=https://sis-t.redsys.es:25443/sis/realizarPago
REDSYS_NOTIFICATION_URL=http://localhost:3000/api/payments/notify
REDSYS_OK_URL=http://localhost:3000/payments/ok
REDSYS_KO_URL=http://localhost:3000/payments/ko

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

---

## Seed Data (`scripts/seed.ts`)

Crear con `npx ts-node scripts/seed.ts`:

- 1 usuario admin: `admin@gambling.local`
- 3 usuarios normales: `alice@gambling.local`, `bob@gambling.local`, `carol@gambling.local`
- 3 partidos:
  - Real Madrid vs Barcelona → `status: 'open'`
  - Atlético vs Sevilla → `status: 'settled'`, `result: 'team1'`
  - PSG vs Bayern → `status: 'closed'`
- Apuestas de prueba asociadas a los partidos cerrados/settled con importes variados.

---

## E2E Tests — Playwright (`tests/e2e/`)

Cubrir los siguientes flujos críticos:

| Test | Flujo |
|------|-------|
| `auth.spec.ts` | Solicitar magic link → recibir correo en Mailhog → clic en link → sesión iniciada |
| `bet-flow.spec.ts` | Login → ver partido → seleccionar pick + importe → pago REDSYS test → confirmación |
| `admin-match.spec.ts` | Login admin → crear partido → cerrar partido → declarar resultado → verificar payouts |
| `my-bets.spec.ts` | Login user → ver historial → verificar saldo actualizado tras settle |

Configuración base URL: `http://localhost:3000`. Usar `playwright.config.ts` con `webServer` apuntando a `npm run dev`.

---

## Design Guidelines

- Dark theme (fondo `#0f0f14`, superficie `#1a1a24`).
- Acento único: verde apuestas `#00e676`.
- Tipografía bold para cuotas y nombres de equipos.
- Sin imágenes; usar placeholders CSS con colores por equipo.
- Mobile-responsive.
- Aplicar **frontend-design** skill en cada página/componente.
