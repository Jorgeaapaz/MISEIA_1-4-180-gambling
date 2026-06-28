@~/.claude/prompts/new_functionality_prompt_spec.md

# Create .env.example and Audit Secrets

## Role
Act as a Software Developer and Security Engineer with expertise in Node.js / Next.js projects and secret management best practices.

## Context
Project: Sports Betting System (`gambling`) — Next.js 16 / MongoDB / REDSYS payments.  
Location: `D:\Master-IA-Dev\04-Bloque4\1-4-180-gambling\gambling`

Non-compliant items to fix:
- `dc_env_example` — No `.env.example` file exists
- `cq_sin_secretos_en_repo` — Secrets are gitignored correctly via `.env*` in `.gitignore`, but a `.env.example` template with placeholder values is missing

The current `.env.local` contains real credentials (REDSYS test keys, JWT secret, MongoDB URI). The `.gitignore` already has `.env*` so secrets are NOT committed. What is missing is the example file that documents the required variables.

## Task
1. Read `.env.local` and `README.md` to understand all required environment variables.
2. Create `.env.example` at project root with:
   - All variable names from `.env.local`
   - Placeholder/example values (NOT the real values)
   - Inline comments explaining each variable's purpose
3. Run `git log -p | grep -i "secret\|password\|api_key\|jwt_secret"` to confirm no secrets are in git history.
4. Update `README.md` environment variables section to reference `.env.example` (`cp .env.example .env.local`).
5. Commit the changes.

### Guidelines
- Placeholder format: `your_value_here`, `change_me`, or descriptive placeholders like `mongodb://localhost:27017`
- Keep the structure identical to `.env.local` (same sections, same ordering)
- Do NOT include real REDSYS credentials, real JWT secrets, or real MongoDB passwords in `.env.example`
- The `.env.example` file MUST be committed (it is not secret)

## Output Format
- File: `.env.example` at project root
- Updated section in `README.md`
- Git commit with message: `chore: add .env.example template and verify secrets not in repo`

## Examples and Steps to Follow
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=gambling

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=change_me_generate_a_random_secret

# Email (Mailhog local SMTP catcher)
MAILHOG_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@gambling.local

# REDSYS Test Gateway
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=1
REDSYS_SECRET_KEY=your_redsys_hmac_secret
REDSYS_URL=https://sis-t.redsys.es:25443/sis/realizarPago
REDSYS_NOTIFICATION_URL=http://localhost:3000/api/payments/notify
REDSYS_OK_URL=http://localhost:3000/payments/ok
REDSYS_KO_URL=http://localhost:3000/payments/ko

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## Output Checklist and Guardrails
- [ ] `.env.example` exists at project root
- [ ] No real credentials in `.env.example`
- [ ] All variables from `.env.local` are represented
- [ ] README updated to show `cp .env.example .env.local`
- [ ] `git log -p` audit shows no secrets in history
- [ ] Changes committed
