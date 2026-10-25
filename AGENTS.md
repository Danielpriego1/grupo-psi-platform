# AGENTS.md — Grupo Psi Platform

Code review rules for this repository. Feed these to the reviewer on every change.

## Project

Web platform for Grupo Psi (grupopsi.com). Vite + React 18 + TypeScript + shadcn/ui + Tailwind CSS.
Backend is Supabase (Postgres + Auth + Storage), accessed directly from the browser.
Deployed as a static build behind Nginx on a VPS. Single-page app.

## Hard blockers — reject the change

1. **Secrets or credentials in source.** Supabase URL, publishable key, tokens, passwords, or
   private emails hardcoded in any file. They must come from `import.meta.env.VITE_*` and never
   be committed.
2. **A second Supabase client.** `createClient` must appear only in
   `src/integrations/supabase/client.ts`. Import `supabase` from `@/integrations/supabase/client`
   everywhere else.
3. **Edits to generated files.** `src/integrations/supabase/client.ts`,
   `src/integrations/supabase/types.ts`, and anything under `src/components/ui/` are generated
   (Supabase CLI and shadcn CLI). Regenerate, never hand-edit.
4. **Unchecked Supabase errors.** Every `supabase` call must handle its `{ data, error }` result.
   Destructuring only `data` and assuming success is a bug.
5. **Rules of Hooks violations.** Conditional or early-returned hooks, hooks inside loops or
   callbacks. Also flag `useEffect` with an incomplete dependency array when it captures stale state.
6. **Commit artifacts.** `dist/`, `node_modules/`, `.env`, or lockfiles staged as content changes.

## Correctness warnings — comment on them

- `tsconfig` is permissive: `noImplicitAny: false`, `strictNullChecks: false`,
  `noUnusedLocals: false`. The compiler will not catch these. Judge nullability, dead code, and
  type holes yourself instead of trusting the build.
- `any` used to silence a Supabase row type mismatch. Prefer narrowing or regenerating types.
- Missing loading and error states on a data-fetching UI path.
- `useState` + `useEffect` for server data where the file already uses `@tanstack/react-query`,
  or the reverse — follow the surrounding file, do not mix patterns in one component.
- Unhandled promise rejection from an async handler wired to `onClick` or `onSubmit` without a
  `try/catch` that surfaces the failure.
- Money rendered from floating-point arithmetic. Format with `Intl.NumberFormat`, round explicitly.
- Dates formatted by hand. Use `date-fns`.
- `console.log` or debug output left on a production path.

## Conventions to enforce

- **Imports** use the `@/*` alias mapped to `src/*`. Reject long relative chains like `../../../`.
- **Pages** are default exports. **Components, hooks, and helpers** are named exports.
- **Styling** is Tailwind utility classes composed with `cn()` from `@/lib/utils`. No inline
  `style` objects for things Tailwind covers, no new CSS files.
- **Icons** come from `lucide-react`.
- **Icons-only buttons** need an `aria-label`. Forms need labels tied to inputs.
- **Forms** use `react-hook-form` with a `zod` schema. Do not hand-roll validation.
- **Language**: code, identifiers, comments, and commit messages in English. User-facing copy in
  Spanish, neutral register. Do not mix both in one string.
- **Imports of UI primitives** come from `@/components/ui/*`, not from Radix directly at call sites.

## Tests

- Runner is `vitest` with `@testing-library/react` and `jsdom`.
- New behavior or a bug fix should come with a test in a neighboring `__tests__/` directory or a
  `*.test.ts(x)` file.
- Tests must not hit the network. Mock the Supabase client.
- Before approving, the author must have run: `npm run lint`, `npm run test`, `npm run build`.

## Scope discipline

- Do not add a dependency when the existing stack covers the need. Call out any new dependency and
  why it is unavoidable.
- Do not refactor unrelated files in a bugfix change. Flag unrelated churn rather than accepting it.
- Do not rename public routes or remove query parameters without flagging the behavior change.
