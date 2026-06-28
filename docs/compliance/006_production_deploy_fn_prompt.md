@~/.claude/prompts/new_functionality_prompt_spec.md

# Deploy Sports Betting App to GCI VM with Docker and Traefik

## Role
Act as a Software Architect and Infrastructure Engineer with expertise in Docker, Traefik, and Google Cloud VM deployments.

## Context
Project: Sports Betting System — Next.js 16 standalone output / MongoDB.  
VM: `gcvmuser@34.174.56.186`  
SSH key: `C:\ubuntuiso\.ssh\vboxuser`  
SSH command: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`  
Deploy directory on VM: `~/MISEIA1-4-180-gambling`  
Public URL: `https://gambling.deviaaps.com`  
Traefik port: `30001` (internal app port: `3000`)  

Infrastructure already running on VM (do NOT recreate):
- Traefik v3.3 container with wildcard cert `*.deviaaps.com`
- Docker network `miseia-net` (bridge, external)
- MongoDB on `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- Mailhog on container `mailhog` within `miseia-net`

Non-compliant items to fix:
- `fn_deploy_publico_accesible` — No public production URL
- `dc_instrucciones_deploy` — No Dockerfile or production deploy steps in README

## Task

### Step 1: Configure Next.js for Standalone Output
Edit `next.config.ts` to add:
```ts
output: 'standalone'
```
This produces a self-contained `.next/standalone` bundle that can run with `node server.js`.

### Step 2: Create Dockerfile
Create `Dockerfile` at project root:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NODE_ENV=production npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Step 3: Create Production Docker Compose
Create `docker-compose.gambling.yml` at project root:
```yaml
services:
  gambling:
    build: .
    container_name: gambling
    env_file: .env.production
    restart: unless-stopped
    networks:
      - miseia-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gambling.rule=Host(`gambling.deviaaps.com`)"
      - "traefik.http.routers.gambling.entrypoints=websecure"
      - "traefik.http.routers.gambling.tls=true"
      - "traefik.http.routers.gambling.tls.certresolver=cloudflare"
      - "traefik.http.services.gambling-svc.loadbalancer.server.port=3000"

networks:
  miseia-net:
    external: true
```

### Step 4: Create env.production File
Create `docs/compliance/env.production`:
```env
MONGODB_URI=mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin
MONGODB_DB=gambling
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
MAILHOG_HOST=mailhog
MAIL_PORT=1025
MAIL_FROM=noreply@gambling.local
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=1
REDSYS_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7
REDSYS_URL=https://sis-t.redsys.es:25443/sis/realizarPago
REDSYS_NOTIFICATION_URL=https://gambling.deviaaps.com/api/payments/notify
REDSYS_OK_URL=https://gambling.deviaaps.com/payments/ok
REDSYS_KO_URL=https://gambling.deviaaps.com/payments/ko
NEXT_PUBLIC_API_URL=https://gambling.deviaaps.com
NODE_ENV=production
```
> NOTE: `docs/compliance/env.production` is for reference. Do NOT commit with real JWT_SECRET. Copy to VM manually.

### Step 5: Deploy to VM
```bash
# 1. Copy files to VM
scp -i C:\ubuntuiso\.ssh\vboxuser -r . gcvmuser@34.174.56.186:~/MISEIA1-4-180-gambling/

# 2. SSH into VM
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186

# 3. On VM: copy env and start
cd ~/MISEIA1-4-180-gambling
cp /path/to/env.production .env.production
docker compose -f docker-compose.gambling.yml up -d --build

# 4. Verify
curl -f https://gambling.deviaaps.com/api/matches
```

### Step 6: Update README
Add a **Production Deploy** section to `README.md`:
- Public URL: `https://gambling.deviaaps.com`
- Dockerfile explanation
- `docker-compose.gambling.yml` usage
- Link to Traefik dashboard for verification

## Output Format
- `Dockerfile` at project root
- `docker-compose.gambling.yml` at project root
- `docs/compliance/env.production` (with placeholder JWT_SECRET)
- Updated `next.config.ts` (standalone output)
- Updated `README.md` with deploy section and public URL
- App running at `https://gambling.deviaaps.com`
- Git commit: `feat: add Dockerfile and production deploy for gambling.deviaaps.com`

## Output Checklist and Guardrails
- [ ] `next.config.ts` has `output: 'standalone'`
- [ ] `Dockerfile` uses multi-stage build (builder + runner)
- [ ] `docker-compose.gambling.yml` joins `miseia-net` (external network)
- [ ] Traefik labels point to `gambling.deviaaps.com`
- [ ] `.env.production` is NOT committed with real secrets (gitignored or placeholder)
- [ ] `curl https://gambling.deviaaps.com/api/matches` returns 200 or 401
- [ ] README updated with public URL and deploy instructions
- [ ] Changes committed and pushed
