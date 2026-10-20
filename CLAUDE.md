# LCMS Frontend — Agent Rules

Next.js 16 + Tailwind v4 + shadcn/ui, Lao-language UI. Package manager: pnpm.

## Read first

- Read `Design.md` and `Frontend_LCMS_Project.md` before any UI work. They are the source of truth.
- Read `docs/AGENT_GUIDE.md` at the start of every session: current state, reuse inventory, recipes, Phase 2 entry gates and known pitfalls.
- Use the `ui-ux-pro-max` skill for UX review only. It must never replace LCMS tokens, fonts, colors or the glassmorphism navy style defined in `Design.md`.
- UI copy is Lao and lives in `src/lib/i18n/lo.ts`. Code, comments and docs are English.

## Global Constraints

- Node >= 20.9. Package manager **pnpm**. Repo root: `d:\LCMS\lcms-frontend`.
- `<html lang="lo">`. Every UI string comes from `src/lib/i18n/lo.ts`; no Lao literals in components. Code, comments, docs in English.
- Next 16: route protection lives in `src/proxy.ts` exporting `proxy()`; there is no `middleware.ts`. `params`/`searchParams` are async. `next lint` does not exist — use `eslint .`.
- No `axios` import outside `src/lib/api/**` and `src/features/*/api/**`.
- Features import other features only via their `index.ts`.
- File names kebab-case; components PascalCase; stores `*.store.ts`; schemas `*.schema.ts`.
- `NEXT_PUBLIC_*` env vars must be read as literal `process.env.NEXT_PUBLIC_X` expressions (Next inlines them only that way).
- Data fetching in Phase 1 is client-side (stores call services) — mock mode runs in the browser.
- Animations: CSS only, `opacity`/`transform` only, Design.md §8 tokens; never animate `backdrop-filter`.
- Numbers: comma grouping (`1,240`) regardless of locale → use `Intl.NumberFormat('en-US')`. Dates `dd/mm/yyyy`.
- Icon-only buttons have a Lao `aria-label`; decorative SVGs `aria-hidden="true"`; status never by color alone.
- Unit tests colocated as `src/**/*.test.ts(x)`; e2e in `e2e/`. Unit run: `pnpm test --run <path>`.
- Commit after each task with a conventional-commit message.
- After any `shadcn add`, rewrite generated `from "cn"` imports to `@/lib/utils/cn`.

## Model workflow (roadmap §1)

- Planner / controller / reviewer (Opus 5.5, main session): writes each phase plan from the spec and the existing code, dispatches one task at a time, reviews every finished task against plan + spec (correctness, Design.md fidelity, a11y, Lao copy keys), runs the whole-branch review per phase. Never writes feature code.
- Implementer + tester (Sonnet 5.5, one subagent per task): implements exactly one task with TDD — failing test first, run it, implement, run unit tests + `pnpm typecheck` + `pnpm lint`, commit. Reports files changed, test output and anything the plan got wrong. Does not change interfaces owned by other tasks; if one is wrong it stops and reports.
- Escalation: if an implementer fails the same verification twice, it stops and reports the error output; the controller diagnoses, amends the plan and re-dispatches.

## Verification

Before claiming a task done:

```bash
pnpm typecheck && pnpm lint && pnpm test --run
```

(`pnpm build` must also pass for scaffold/config changes.)

`pnpm e2e` runs the Playwright suite. To also capture the Definition-of-Done screenshots into `test-results/dod/`, run `DOD_SHOTS=1 pnpm e2e`.
