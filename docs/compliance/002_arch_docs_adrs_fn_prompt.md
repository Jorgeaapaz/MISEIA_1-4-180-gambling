@~/.claude/prompts/new_functionality_prompt_spec.md

# Add Architecture Diagram, ADRs, and Quantitative Decision Documentation

## Role
Act as a Software Architect with expertise in documentation, architecture decision records (ADRs), and system design for Next.js full-stack applications.

## Context
Project: Sports Betting System (`gambling`) — Next.js 16 / MongoDB / REDSYS / Playwright.  
Location: `D:\Master-IA-Dev\04-Bloque4\1-4-180-gambling\gambling`

Non-compliant items to fix:
- `dc_diagrama_arquitectura` — No architecture diagram exists
- `dc_adrs_o_decision_log` — No ADRs or decision log
- `dc_justificacion_cuantitativa` — No decision backed by numbers/benchmarks

The README already documents design patterns (Singleton, Strategy, Repository-style). The task is to formalize this into diagrams and structured ADRs.

## Task
1. Create a Mermaid architecture diagram in `docs/architecture.md` showing:
   - User Browser → Next.js App Router
   - Next.js → MongoDB (via `lib/db.ts` singleton)
   - Next.js → Mailhog (via `lib/mail.ts`)
   - REDSYS TPV → Next.js IPN (`/api/payments/notify`)
   - Match lifecycle state machine (open → closed → settled)
2. Create three ADR files in `docs/decisions/`:
   - `ADR-001-mongodb-singleton.md` — Why singleton MongoClient (connection pool exhaustion in serverless)
   - `ADR-002-jwt-localstorage-no-cookies.md` — Why localStorage (no CSRF risk, simpler SSR)
   - `ADR-003-proportional-payout.md` — Why proportional payout vs fixed odds (include a numeric example comparing the two models)
3. Update `README.md` to link to architecture diagram and ADR index.
4. Commit all documentation files.

### Architecture Diagram Guidelines
- Use Mermaid `graph TD` or `sequenceDiagram`
- Include at minimum: browser, Next.js routes, MongoDB, Mailhog, REDSYS
- Show the IPN callback flow (REDSYS → notify → validate HMAC → activate bet)

### ADR Format
```markdown
# ADR-00N: Title

## Status
Accepted

## Context
What problem were we facing...

## Decision
What we decided...

## Consequences
Positive: ...
Negative: ...
Trade-offs: ...
```

### Quantitative Justification (ADR-001)
Include: how many concurrent connections MongoDB allows by default (100), why a new connection per serverless invocation would exhaust the pool in minutes under load, and the measured cold-start latency difference with/without the singleton pattern (~300ms vs ~5ms for subsequent requests).

## Output Format
- `docs/architecture.md` with Mermaid diagram
- `docs/decisions/ADR-001-mongodb-singleton.md`
- `docs/decisions/ADR-002-jwt-localstorage-no-cookies.md`
- `docs/decisions/ADR-003-proportional-payout.md`
- Updated `README.md` with links
- Git commit: `docs: add architecture diagram and ADRs`

## Output Checklist and Guardrails
- [ ] Mermaid diagram renders correctly (validate at mermaid.live)
- [ ] All 3 ADRs follow the format: Status / Context / Decision / Consequences
- [ ] ADR-001 or ADR-003 contains at least one numeric/quantitative comparison
- [ ] README links to all new docs
- [ ] No placeholder text left in docs
- [ ] Changes committed
