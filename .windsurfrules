# Verdkomunumo AI Engineering Guidelines

This document contains explicit rules and architecture patterns for Verdkomunumo. All AI agents (Cursor, Copilot, Cline, Antigravity, Claude Code, etc.) MUST read and adhere to these guidelines BEFORE writing any code.

## 1. Tech Stack Overview
- **Core:** React 18, TypeScript, Vite
- **State Management:** Zustand (global state), TanStack React Query v5 (server state)
- **Backend & Auth:** Supabase (PostgreSQL, Edge Functions, Storage, Auth)
- **Routing:** React Router v6
- **Styling:** Vanilla CSS (App-wide) / Tailwind (if specifically migrated)

---

## 2. TanStack React Query Standards
React Query is the backbone of this application. Most critical bugs stem from cache mismatch.
### A. Query Key Generation (Fuzzy Matching Safety)
When creating query keys via factory functions (e.g., `src/lib/query/keys.ts`), **NEVER** include `undefined` as an array element for optional parameters. React Query v5 treats `undefined` as a strict match element, destroying fuzzy prefix matching for cache invalidation.
**❌ INCORRECT:**
```typescript
feed: (params?: object) => ['feed', params] as const
```
**✅ CORRECT:**
```typescript
feed: (params?: object) => params ? ['feed', params] as const : ['feed'] as const
```

### B. Optimistic UI Updates
When implementing features like "Likes", "Follows", or "Edits", **ALWAYS** use Optimistic UI via `onMutate`. 
- You MUST ensure the mutation's `setQueryData` target key perfectly reflects the EXACT parameters used by the `useQuery`/`useInfiniteQuery` hook.
- e.g. If the Feed Hook uses `['feed', { filter, profileId }]`, the mutation's `onMutate` MUST use `['feed', { filter, profileId }]`.

---

## 3. Auth & Session Lifecycle (Supabase + Zustand)
Supabase automatically triggers `onAuthStateChange` listeners upon tab focus, visibility change, and token refreshes.
- DO NOT set global states to `null` on `SIGNED_IN` or `TOKEN_REFRESHED` events if the incoming session user ID perfectly matches the currently cached Zustand `user.id`.
- Failing to use a `preserveProfile: true` flag during re-synchronization will cause the app layout to erroneously flash guest UI elements.

---

## 4. Vite & Build Bundling 
- **DO NOT** configure custom `manualChunks` in `vite.config.ts` unless there is an explicitly confirmed dependency size threshold bypass. Over-aggressively splitting chunks creates fatal cyclic dependencies (especially with `zod` and forms validation) resulting in empty module exports on Vercel production.
- Leave bundling algorithms to Vite's automatic Rolldown/Rollup capabilities.

---

## 5. UI/UX Rules
- **Disabled Interaction States**: Buttons handling asynchronous actions (e.g. Likes, Posts) should immediately render an `<InlineSpinner />` mask on `isPending`, but the underlying text/data should be driven by the instantaneous Optimistic Cache update.
- Always include thorough error catching and render via `toast.error()`.
- Do not add arbitrary CSS classes or inline styles unless completely necessary; adhere to standard BEM-like class layouts existing in the CSS architecture.
