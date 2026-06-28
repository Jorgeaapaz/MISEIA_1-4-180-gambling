@~/.claude/prompts/new_functionality_prompt_spec.md

# Create GitLab CI/CD Pipeline for Sports Betting System

## Role
Act as a Software Architect and DevOps Engineer expert in GitLab CI/CD and Docker deployments.

## Context
Project: Sports Betting System — Next.js 16 / MongoDB / Playwright E2E tests.  
GitLab instance: `gitlab.codecrypto.academy`  
Project path: `jorgeaapaz/MISEIA_1-4-180-gambling`  
Remote VM: `gcvmuser@34.174.56.186`  
Deploy directory: `~/MISEIA1-4-180-gambling`  
App domain: `gambling.deviaaps.com`

Infrastructure on VM:
- Traefik v3.3, network `miseia-net`, MongoDB on port `27020`

Environment file: `docs/compliance/env.production`

Non-compliant item: `cq_ci_funcional` — No GitLab CI pipeline configured.

## Task
Using `/glab` skill, create `.gitlab-ci.yml` at project root with the following pipeline:

### Stages
1. `test` — lint + unit tests
2. `build` — production build (Next.js standalone output)
3. `deploy` — SSH deploy to GCI VM

### Important Constraints
- `NODE_ENV=production` must be set **only** on the build command, NOT as a job-level or pipeline-level variable
- E2E tests (Playwright) are excluded from CI (they require a running server and browser)
- Unit tests (`npm run test:unit`) run in the `test` stage
- Use GitLab CI artifacts to pass `.next/` between `build` and `deploy` stages

### Pipeline Specification

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"
  DEPLOY_DIR: "~/MISEIA1-4-180-gambling"

lint-and-test:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm run lint
    - npm run test:unit
  cache:
    key: "$CI_COMMIT_REF_SLUG"
    paths:
      - node_modules/

build:
  stage: build
  image: node:20-alpine
  script:
    - npm ci
    - NODE_ENV=production npm run build
  artifacts:
    paths:
      - .next/
      - public/
      - package.json
      - package-lock.json
    expire_in: 1 hour
  only:
    - master
    - main

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client rsync
    - eval $(ssh-agent -s)
    - echo "$VM_SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - ssh-keyscan -H 34.174.56.186 >> ~/.ssh/known_hosts
  script:
    - rsync -avz --delete --exclude='.git' --exclude='node_modules' . $VM_USER@34.174.56.186:$DEPLOY_DIR/
    - |
      ssh $VM_USER@34.174.56.186 << 'EOF'
        cd ~/MISEIA1-4-180-gambling
        cat > .env.production << ENVEOF
      MONGODB_URI=$MONGODB_URI
      MONGODB_DB=gambling
      JWT_SECRET=$JWT_SECRET
      MAILHOG_HOST=mailhog
      MAIL_PORT=1025
      MAIL_FROM=noreply@gambling.local
      REDSYS_MERCHANT_CODE=999008881
      REDSYS_TERMINAL=1
      REDSYS_SECRET_KEY=$REDSYS_SECRET_KEY
      REDSYS_URL=https://sis-t.redsys.es:25443/sis/realizarPago
      REDSYS_NOTIFICATION_URL=https://gambling.deviaaps.com/api/payments/notify
      REDSYS_OK_URL=https://gambling.deviaaps.com/payments/ok
      REDSYS_KO_URL=https://gambling.deviaaps.com/payments/ko
      NEXT_PUBLIC_API_URL=https://gambling.deviaaps.com
      ENVEOF
        docker compose -f docker-compose.gambling.yml up -d --build --force-recreate
      EOF
  only:
    - master
    - main
  environment:
    name: production
    url: https://gambling.deviaaps.com
```

### GitLab CI/CD Variables to create (use `/glab` skill):
- `VM_SSH_PRIVATE_KEY` — masked, protected
- `VM_USER` — `gcvmuser`
- `MONGODB_URI` — `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin` — masked
- `JWT_SECRET` — masked, protected
- `REDSYS_SECRET_KEY` — `sq7HjrUOBfKmC576ILgskD5srU870gJ7` — masked

Use `glab variable set` to register all variables.  
Use `glab ci view` to monitor pipeline execution.

## Output Checklist and Guardrails
- [ ] `.gitlab-ci.yml` created at project root
- [ ] `NODE_ENV=production` is ONLY on the build command (`NODE_ENV=production npm run build`), NOT a job-level variable
- [ ] Unit tests run in `test` stage; E2E tests excluded
- [ ] Artifacts passed from `build` to `deploy`
- [ ] SSH deploy uses `VM_SSH_PRIVATE_KEY` GitLab variable
- [ ] All CI variables set via `glab variable set`
- [ ] Pipeline runs green on `master`/`main` push
- [ ] `glab ci view` confirms all stages pass
