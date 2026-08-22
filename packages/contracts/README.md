# @suraksha-sutra/contracts

The contracts package is the sole public boundary for SurakshaSutra. It
contains strict Zod schemas, inferred TypeScript types, discriminated unions,
and safe parsing helpers for API, persistence, analytics, curriculum, and
Vertex AI boundaries.

```bash
pnpm install
pnpm exec tsc -p tsconfig.json --noEmit
pnpm test
```

Schemas reject unknown object keys by default. `safeParseContract` returns a
stable result without throwing; `parseContract` throws a `ContractValidationError`
that carries the Zod issue list.
