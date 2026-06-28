# PERT Compliance Plan — Sports Betting System (gambling)
**Date:** 2026-06-27  
**Project:** `1-4-180-gambling`

---

## PERT Compliance Plan

Logical ordered list of tasks to achieve full compliance. Tasks with no dependencies can run in parallel; tasks that depend on others are listed after their prerequisites.

### Path to Full Compliance

```
[T1] .env.example + secrets audit
  → No dependencies. Fast win, unblocks CI/CD pipelines.
  → Prompt: docs/compliance/001_env_example_secrets_fn_prompt.md

[T2] Architecture diagram + ADRs + quantitative justification
  → No dependencies. Pure documentation work.
  → Prompt: docs/compliance/002_arch_docs_adrs_fn_prompt.md

[T3] Unit tests + coverage report
  → No dependencies. Parallel with T1 and T2.
  → Prompt: docs/compliance/003_unit_tests_coverage_fn_prompt.md

[T4] GitHub Actions CI/CD pipeline
  → Depends on T1 (.env.example as template for secrets) and T3 (tests must pass in CI).
  → Prompt: docs/compliance/004_github_cicd_fn_prompt.md

[T5] GitLab CI/CD pipeline
  → Depends on T1 and T3. Parallel with T4.
  → Prompt: docs/compliance/005_gitlab_cicd_fn_prompt.md

[T6] Production deploy to GCI VM via Docker + Traefik
  → Depends on T4 (GitHub Actions deploy job) and T1 (env.production file).
  → Prompt: docs/compliance/006_production_deploy_fn_prompt.md
```

### Dependency Graph

```
T1 ──┬──► T4 ──► T6
     │
T2   │
     │
T3 ──┴──► T5
```

- **T1, T2, T3** — can run in parallel (no dependencies)
- **T4, T5** — start after T1 + T3 are complete
- **T6** — start after T4 is complete and app is building successfully in CI

---

## Execution PERT

Numbered execution order based on the PERT critical path.

| # | Task | ID | Depends On | Prompt File | Est. Time |
|---|---|---|---|---|---|
| 1 | Create `.env.example` and audit secrets | `dc_env_example` / `cq_sin_secretos_en_repo` | — | `001_env_example_secrets_fn_prompt.md` | 30 min |
| 2 | Add architecture diagram, ADRs, quantitative decision | `dc_diagrama_arquitectura` / `dc_adrs_o_decision_log` / `dc_justificacion_cuantitativa` | — | `002_arch_docs_adrs_fn_prompt.md` | 2 h |
| 3 | Write unit tests for `lib/` modules and generate coverage report | `cq_cobertura_alta` | — | `003_unit_tests_coverage_fn_prompt.md` | 3 h |
| 4 | Create GitHub Actions CI/CD pipeline (test + build + deploy) | `cq_ci_funcional` | T1, T3 | `004_github_cicd_fn_prompt.md` | 2 h |
| 5 | Create GitLab CI/CD pipeline (test + build) | `cq_ci_funcional` | T1, T3 | `005_gitlab_cicd_fn_prompt.md` | 1 h |
| 6 | Dockerize app and deploy to GCI VM via Traefik | `fn_deploy_publico_accesible` / `dc_instrucciones_deploy` | T4 | `006_production_deploy_fn_prompt.md` | 3 h |

**Total estimated time:** ~11.5 hours (parallelizing T1+T2+T3 reduces wall time to ~6-7 hours)

**Critical path:** T1 → T3 → T4 → T6
