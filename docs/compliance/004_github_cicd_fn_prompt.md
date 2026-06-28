@~/.claude/prompts/new_functionality_prompt_spec.md

# Create a Github CI/CD Pipeline and Deploy App to VM at Google Cloud

## Role
Act as a Software Architect, you are an expert in Github and Google Cloud Services

## Task
Create Github actions that allows to compile and deploy the app to `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186` in the directory ~/MISEIA1-4-180-gambling. Test and build must be done in a GitHub Actions. The service must be created in the remote ubuntu VM in Docker.

The app must be accessible through Traefik using the domain gambling.deviaaps.com, port 30001, use the traefik wildcard *.deviaaps.com.

Use /gh-cli and gcloud for all secrets required.

## Context
Project: Sports Betting System — Next.js 16 / MongoDB / Playwright E2E tests.  
GitHub repository: `https://github.com/Jorgeaapaz/MISEIA_1-4-180-gambling`  
Remote VM: `gcvmuser@34.174.56.186`  
SSH key: `C:\ubuntuiso\.ssh\vboxuser`  
Deploy directory on VM: `~/MISEIA1-4-180-gambling`  
App domain: `gambling.deviaaps.com`  
Traefik port: `30001`  
MongoDB (remote): `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`

Infrastructure already running on the VM:
- Traefik v3.3 with wildcard cert `*.deviaaps.com` via Cloudflare DNS-01
- Network: `miseia-net` (bridge)
- MongoDB exposed on port `27020`

Environment file for production: `docs/compliance/env.production`

### env.production contents to use:
```env
MONGODB_URI=mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin
MONGODB_DB=gambling
JWT_SECRET=<generate_secure_random>
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
```

## GitHub Actions Workflow Requirements

Create `.github/workflows/ci-cd.yml` with:

**Job 1: `test-and-build`** (runs on push to `main`/`master`)
- Checkout code
- Setup Node.js 20
- `npm ci`
- `npm run lint`
- `npm run test:unit` (unit tests only — E2E requires running app)
- `NODE_ENV=production npm run build`
- Upload `.next/` artifact

**Job 2: `deploy`** (runs after `test-and-build` succeeds)
- Download artifact
- SSH into VM: `gcvmuser@34.174.56.186`
- `rsync` or `scp` project files to `~/MISEIA1-4-180-gambling`
- Write production env file from GitHub secrets
- Build and restart Docker container
- Health check: `curl -f https://gambling.deviaaps.com/api/matches`

### Docker container on VM (app service):
```yaml
# docker-compose.gambling.yml on the VM
services:
  gambling:
    image: node:20-alpine
    container_name: gambling
    working_dir: /app
    command: node server.js
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

### GitHub Secrets to create (use `gh secret set`):
- `VM_SSH_PRIVATE_KEY` — contents of `C:\ubuntuiso\.ssh\vboxuser`
- `VM_HOST` — `34.174.56.186`
- `VM_USER` — `gcvmuser`
- `MONGODB_URI` — `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- `JWT_SECRET` — secure random string
- `REDSYS_SECRET_KEY` — `sq7HjrUOBfKmC576ILgskD5srU870gJ7`

Use `/gh-cli` skill to create secrets and validate workflow.

## Output Checklist and Guardrails
- [ ] `.github/workflows/ci-cd.yml` created
- [ ] Unit tests run in CI (not E2E — those require a running server)
- [ ] `NODE_ENV=production` only set for the build step, not as job-level variable
- [ ] Build artifact uploaded/downloaded between jobs
- [ ] SSH deploy uses key from GitHub secret
- [ ] Docker container on VM joins `miseia-net`
- [ ] Traefik labels set for `gambling.deviaaps.com`
- [ ] Health check validates deploy
- [ ] All secrets registered via `gh secret set`
- [ ] Workflow pushed and green on GitHub
- [ ] `README.md` updated with public URL `https://gambling.deviaaps.com`
