# Retrospectiva de Sesión — 2026-04-23
### Implementación completa del sistema de apuestas deportivas (GamblingApp)

---

## Resumen / Overview

Sesión de implementación completa de una aplicación de apuestas deportivas con Next.js 16.2.4, MongoDB, autenticación por magic link (JWT), integración con pasarela de pago REDSYS (modo test) y panel de administración. El build de producción compila sin errores. No se realizó prueba manual en el navegador; queda pendiente para la siguiente sesión.

---

## Proceso de instalación / Installation

```bash
# 1. Clonar/partir del proyecto base Next.js ya existente
# (ya había un create-next-app en el directorio)

# 2. Instalar dependencias de producción
npm install mongodb jsonwebtoken nodemailer

# 3. Instalar dependencias de desarrollo
npm install --save-dev @types/jsonwebtoken @types/nodemailer @playwright/test ts-node

# 4. Crear .env.local con las credenciales (ver sección de configuración)

# 5. Poblar la base de datos con datos de prueba
npm run seed

# 6. Verificar build de producción
npm run build
```

---

## Comandos ejecutados / Commands Run

| Comando | Descripción |
|---------|-------------|
| `npm install mongodb jsonwebtoken nodemailer` | Driver MongoDB nativo, JWT y cliente SMTP |
| `npm install --save-dev @playwright/test ts-node` | Tests E2E y ejecución de scripts TypeScript |
| `npm run build` | Compila la app en modo producción (verificación de tipos incluida) |
| `npm run seed` | Ejecuta `scripts/seed.ts` para poblar MongoDB con datos iniciales |
| `npm run dev` | Arranca el servidor de desarrollo en `http://localhost:3000` |
| `npm run test:e2e` | Ejecuta los tests Playwright (requiere servidor activo o usa `webServer`) |

---

## Levantar y detener la aplicación / Running & Stopping

### Desarrollo
```bash
# Arrancar
cd D:/Master-IA-Dev/04-Bloque4/1-4-180-gambling/gambling
npm run dev
# → http://localhost:3000

# Detener
# Ctrl+C en la terminal
```

### Producción
```bash
npm run build
npm run start
# → http://localhost:3000
```

### Seed de datos (primera vez o reset)
```bash
npm run seed
# Crea: 4 usuarios, 3 partidos, 5 apuestas en MongoDB (gambling DB)
# ⚠️  BORRA los datos existentes antes de insertar
```

### Servicios externos necesarios
```bash
# MongoDB (local, ya instalado)
# Se conecta a mongodb://localhost:27017/gambling

# Mailhog (Docker) — necesario para magic links
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
# SMTP: localhost:1027  |  Web UI: http://localhost:8025
```

### Probar endpoints con curl
```bash
# Solicitar magic link
curl -X POST http://localhost:3000/api/auth/request \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@gambling.local"}'

# Listar partidos abiertos (necesita token JWT)
curl http://localhost:3000/api/matches?status=open \
  -H "Authorization: Bearer <JWT>"

# Crear partido (admin)
curl -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_ADMIN>" \
  -d '{"team1":"Real Madrid","team2":"Barcelona"}'

# Ver historial de apuestas del usuario
curl http://localhost:3000/api/bets \
  -H "Authorization: Bearer <JWT>"

# Reporte admin
curl http://localhost:3000/api/admin/reports \
  -H "Authorization: Bearer <JWT_ADMIN>"
```

---

## URLs de prueba / Test URLs

| URL | Descripción |
|-----|-------------|
| `http://localhost:3000` | Home — lista de partidos abiertos |
| `http://localhost:3000/login` | Formulario magic link |
| `http://localhost:3000/auth/verify?token=<jwt>` | Verificación de token |
| `http://localhost:3000/my-bets` | Historial de apuestas del usuario |
| `http://localhost:3000/admin` | Dashboard de administración |
| `http://localhost:3000/admin/matches` | Gestión de partidos |
| `http://localhost:3000/admin/matches/new` | Crear nuevo partido |
| `http://localhost:3000/admin/users` | Listado de usuarios |
| `http://localhost:8025` | Mailhog Web UI — ver emails enviados |

---

## Configuración de entorno / Environment Variables

Archivo `.env.local` (ignorado por git):

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

# REDSYS (test / entorno sandbox)
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

## Usuarios de prueba (seed)

| Email | Rol | Saldo inicial |
|-------|-----|--------------|
| `admin@gambling.local` | admin | 0€ |
| `alice@gambling.local` | user | 850€ (ganó apuesta seed) |
| `bob@gambling.local` | user | 0€ |
| `carol@gambling.local` | user | 0€ |

**Flujo de login:** ir a `/login` → introducir email → revisar Mailhog en `http://localhost:8025` → clic en el enlace → sesión activa.

---

## Arquitectura implementada / Architecture

```
gambling/
├── app/
│   ├── api/
│   │   ├── auth/request/route.ts     — POST magic link → Mailhog
│   │   ├── auth/verify/route.ts      — GET valida JWT, devuelve sesión 7d
│   │   ├── matches/route.ts          — GET listar, POST crear (admin)
│   │   ├── matches/[id]/route.ts     — PATCH cerrar/declarar resultado
│   │   ├── bets/route.ts             — GET historial, POST crear + REDSYS form
│   │   ├── payments/notify/route.ts  — POST IPN REDSYS (HMAC-SHA256)
│   │   ├── admin/users/route.ts      — GET listar usuarios
│   │   └── admin/reports/route.ts    — GET estadísticas globales
│   ├── page.tsx                      — Home (partidos por status)
│   ├── login/page.tsx                — Formulario magic link
│   ├── auth/verify/page.tsx          — Procesa token URL
│   ├── matches/[id]/page.tsx         — Detalle + formulario apuesta
│   ├── my-bets/page.tsx              — Historial de apuestas
│   ├── payments/ok|ko/page.tsx       — Confirmación/error pago
│   └── admin/                        — Dashboard, matches, users
├── lib/
│   ├── types.ts     — Interfaces Match, Bet, User, MagicToken + JSON variants
│   ├── db.ts        — Singleton MongoClient (global cache en dev)
│   ├── auth.ts      — signMagicToken, signSessionToken, requireAuth, requireAdmin
│   ├── redsys.ts    — Triple-DES key derivation + HMAC-SHA256 signature
│   ├── payout.ts    — Algoritmo de reparto proporcional
│   └── mail.ts      — Nodemailer → Mailhog
├── context/
│   └── AppContext.tsx  — GlobalContext: user, token, login(), logout(), authHeader()
├── components/
│   └── Navbar.tsx      — Navegación responsiva con enlaces por rol
├── scripts/
│   └── seed.ts         — Datos iniciales (ts-node + tsconfig.seed.json)
├── tests/e2e/
│   ├── auth.spec.ts         — Magic link flow
│   ├── bet-flow.spec.ts     — Login → partido → apuesta → REDSYS
│   ├── admin-match.spec.ts  — Crear/cerrar partido, declarar resultado
│   └── my-bets.spec.ts      — Historial de apuestas
├── playwright.config.ts     — baseURL, webServer: npm run dev
└── tsconfig.seed.json       — Config separada para ts-node (CommonJS)
```

---

## Algoritmo de payouts

```
totalPot   = suma de amountCents de todas las apuestas del partido
winnersPot = suma de amountCents de las apuestas con pick == resultado

payout(bet) = floor((bet.amountCents / winnersPot) * totalPot)

Si winnersPot == 0 → todos reciben status:'refunded' con su amountCents devuelto
```

Implementado en `lib/payout.ts`, invocado automáticamente en el PATCH de matches cuando `status: 'settled'`.

---

## Configuración de red / Network Configuration

La app corre localmente sin necesidad de NAT/VirtualBox. Servicios:

- **Next.js dev server:** `localhost:3000`
- **MongoDB:** `localhost:27017` (instalación nativa Windows)
- **Mailhog SMTP:** `localhost:1027` (Docker)
- **Mailhog Web UI:** `localhost:8025` (Docker)
- **REDSYS:** conexión saliente a `sis-t.redsys.es:25443` (sandbox)

> **Nota REDSYS IPN en dev:** El TPV sandbox no puede llamar a `localhost:3000/api/payments/notify`. Para probar la notificación IPN en desarrollo, usar [ngrok](https://ngrok.com/) o simular la llamada manualmente con curl:
> ```bash
> # Simular notificación IPN de REDSYS (test)
> curl -X POST http://localhost:3000/api/payments/notify \
>   -H "Content-Type: application/x-www-form-urlencoded" \
>   -d "Ds_MerchantParameters=...&Ds_Signature=...&Ds_SignatureVersion=HMAC_SHA256_V1"
> ```

---

## Problemas encontrados / Problems & Solutions

| Problema | Solución |
|----------|----------|
| Error TypeScript: `{ status: string }` no asignable a `Filter<Match>` en `api/matches/route.ts` | Cast del status a `Match['status']` y del filtro a `Record<string, unknown>` |
| `.env.local` ignorado por git (`.gitignore`) | Correcto por seguridad; no se fuerza el add. El archivo existe localmente. |
| `npm run seed` requiere config TypeScript separada (`moduleResolution: bundler` no compatible con ts-node) | Se creó `tsconfig.seed.json` con `module: commonjs` para ts-node |
| **IndexKeySpecsConflict en MongoDB (code 86):** `POST /api/auth/request` devolvía 500. El seed creó el índice `redsysOrderId` sin `sparse: true`, pero `lib/db.ts` lo intentaba crear con `sparse: true`, generando conflicto en cada arranque. | Eliminar `sparse: true` del `createIndex` en `lib/db.ts` para que coincida con el índice ya existente creado por el seed. |
| **Magic link redirige a la respuesta JSON de la API** en lugar del dashboard: el enlace del correo apuntaba a `/api/auth/verify?token=...` (endpoint REST) y el navegador mostraba el JSON directamente. | Cambiar la URL del enlace en `lib/mail.ts` de `/api/auth/verify` a `/auth/verify` (página frontend que llama a la API, guarda el JWT en localStorage y redirige a `/`). |

---

## Resultados y conclusiones / Results & Conclusions

### ✅ Completado
- Build de producción sin errores de TypeScript
- Seed ejecutado correctamente (4 usuarios, 3 partidos, 5 apuestas)
- Todas las rutas API implementadas según especificación AGENTS.md
- Autenticación JWT sin cookies, almacenada en localStorage
- Integración REDSYS con firma HMAC-SHA256 y derivación de clave Triple-DES
- Payout algorithm con reparto proporcional y reembolso si no hay ganadores
- Diseño dark theme (#0f0f14 / #00e676) sin Tailwind, CSS-in-JS inline
- GlobalContext evita prop drilling en toda la app

### ⏳ Pendiente para próxima sesión
- Prueba manual en navegador del flujo completo (login → apuesta → pago)
- Instalar browsers de Playwright: `npx playwright install`
- Ejecutar tests E2E: `npm run test:e2e`
- Probar IPN de REDSYS con ngrok o simulación manual
- Añeadir API endpoint para que el usuario vea su saldo (`/api/me`)
- Considerar página de perfil con balance visible en la Navbar
