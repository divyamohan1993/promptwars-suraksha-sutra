# SurakshaSutra Orchestration Pack

## Local foundation setup

The application is a strict pnpm workspace with two independently buildable applications:

- `apps/web` — Angular 21.2 PWA shell.
- `apps/api` — NestJS 11 HTTP API.

Node.js 22.22.1 (or a compatible Node 22.12+ release) and pnpm 11.22.0 are required.

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Copy `.env.example` to `.env` and provide environment-specific values through that ignored local
file. The example intentionally contains names only; never commit populated values. Production
CORS origins must be explicit HTTPS origins, and the API boundary rejects wildcard origins.

The API listens on the configured `PORT` and exposes:

- `GET /api/v1/health` — process health and uptime.
- `GET /api/v1/ready` — validated runtime configuration readiness.

The Angular shell is available with `pnpm --filter @surakshasutra/web start`, and the API is
available with `pnpm --filter @surakshasutra/api start:dev`. The PWA service worker is enabled for
production builds and disabled during development.

Place all files in the repository root before starting Codex.

## File roles

- `AGENTS.md` — Sol's orchestration authority, subagent protocol, execution waves, scope, and definition of done.
- `challenge.md` — organizer problem statement preserved verbatim.
- `what-to-do.md` — anti-disqualification rules converted into operational evidence and submission gates.
- `parameter-impact.md` — strict, measurable release criteria for all six scoring parameters.
- `idea.md` — machine-oriented product, adaptive-learning, data, safety, and acceptance specification.
- `TECH_STACK.md` — deployed technologies, GenAI usage, adaptive mechanisms, and security boundaries.
- `PROMPTS.md` — verbatim deployed Vertex prompts and clearly separated recommended prompt revisions.

## Important corrections

- The Codex instruction filename is normalized to exact-case `AGENTS.md`.
- The pasted research brief is normalized and adapted into `idea.md` for SurakshaSutra.
- Demo profiles begin with unassessed concept state. Their results must be created by real evaluator interactions.
- Deterministic logic controls learner state. The model handles constrained generation and interpretation.
- Contextual-bandit optimization is deferred until genuine interaction data exists.
- No P1 or P2 feature may displace a complete, verified P0 evaluator journey.

## Start condition

Launch Codex from the repository root. Sol must read the files in the order specified by `AGENTS.md`, audit the existing repository, create the orchestration state, and then delegate through isolated subagent worktrees.
