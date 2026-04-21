# The Block

**Live demo:** https://the-block-red.vercel.app
**Repo:** https://github.com/sahar-f/the-block

---

## How to Run

The **live demo at https://the-block-red.vercel.app** is the intended evaluator experience — it runs against Supabase, so real-time bidding, cross-tab updates, and bid persistence all work. A two-minute browse there shows the app at full capability.

Local setup:

```bash
git clone https://github.com/sahar-f/the-block.git
cd the-block/app
npm install
npm run dev
```

A local run works with zero env vars — the app falls back to the committed JSON for the 200 vehicles (condition summaries included). For the full feature set locally (real-time bid propagation, persistence across refreshes), provision Supabase and drop `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into `app/.env`. Schema is in [supabase/migrations/](supabase/migrations/); run [scripts/seed.mjs](scripts/seed.mjs) to seed data.

## Time Spent

**~7 hours.**

- Scaffold, Supabase schema, RLS, CI — 1h
- Types, dual-backend data layer, clock singleton, session — 1h
- Inventory page (search, 7 filter categories, 2 range filters, 6 sort options, stats bar, ending-soon strip) — 1h
- Vehicle detail page (image gallery, specs, condition panels) — 1h
- Bidding flow with TDD (typed errors, buy-now, reserve logic, atomic `place_bid` RPC) — 1h
- Polish, accessibility, animations, loading/empty/error states — 45m
- Unit + E2E tests — 30m
- Condition Summary feature with CarFax link — 45m
- Vercel deploy + docs — 30m
- UI upgrade (Figma MCP, lazy routes, CI E2E addition, favicon versioning) — 1h

## Assumptions and Scope

### Business rules (codified as constants in [app/src/lib/constants.ts](app/src/lib/constants.ts))

- **`MIN_BID_INCREMENT = 100`** — all bids must exceed the current bid by at least $100. A single constant is easier to reason about for a prototype.
- **`MAX_BID = 10_000_000`** — $10M upper bound on any single bid. Prevents integer overflow and absurd inputs; comfortably above any realistic wholesale vehicle price.
- **`AUCTION_DURATION_MS = 4 hours`** — every auction runs for four hours from its `auction_start`. Real auctions vary by listing; the synthetic dataset doesn't carry durations so I normalized to a single window. Changing to per-vehicle durations is a `Vehicle` type addition.
- **`AWAY_THRESHOLD_MS = 30s`** — threshold for the "ended while you were away" heuristic. A `live → ended` transition that spans a jump larger than 30 seconds between ticks indicates browser sleep, not natural countdown — the UI shows an inline message.
- **`ENDING_SOON_MS = 1 hour`** — vehicles with less than an hour remaining surface in the "Ending Soon" strip on the inventory page.

### Auction mechanics

- **First bid can equal `starting_bid`.** Subsequent bids must exceed the current bid by `MIN_BID_INCREMENT`. 
- **Buy Now sets the winning price but doesn't terminate the auction window.** Clicking Buy Now patches `current_bid` to `buy_now_price`; the auction keeps running until `auction_start + AUCTION_DURATION_MS`. A production flow would end the auction immediately and lock the sale — a two-line change in the RPC (stamp `sold_at` + short-circuit further bids).
- **Reserve status is informational, not gating.** The "Reserve Met / Not Met" badge reports state; the auction does not automatically cancel a sale below reserve. Production adds a seller-accept-or-decline flow on close.
- **Bids are permanent.** No retraction, cancellation, or editing after placement. Matches a legally-binding wholesale context.
- **One auction per vehicle.** No relist flow for vehicles that end below reserve; a production system would push those back into inspection or schedule a reauction.
- **Whole-dollar pricing.** All amounts are integers; no cents. `MIN_BID_INCREMENT = 100` enforces whole-hundred bids. Appropriate for wholesale vehicle prices.
- **Single-dimension condition grade.** `condition_grade` is one float 0–5. Real platforms grade multi-dimensionally (body / mechanical / interior / electrical); the single-score presentation trades nuance for scannability.
- **Damage notes are free-text, not categorized.** Each note is a string. A production taxonomy would structure each note as `{location, type, severity}` so filtering by damage pattern becomes possible.

### Content and localization

- **Currency: CAD throughout, rendered as `$` without the currency code.** The data points towards all prices in Canadian dollars. The `formatCurrency` helper centralizes the locale decision, so adding an explicit "CAD" suffix or a USD toggle is a one-function change.
- **English only.** OPENLANE has a significant French-speaking Canadian user base; i18n was not in this timebox.
- **Images are themed placeholder URLs** (`placehold.co` with dark-theme colors). Real vehicle photography is out of scope for a prototype; every image has a styled onError fallback so broken links don't degrade the UI.
- **Date/time display uses browser-local time.** Reasonable for a demo; production would surface timezone explicitly on listings.

### Data model

- **JSONB column for `vehicles` in Postgres.** The `data` column stores each vehicle as a JSON object matching the `Vehicle` TypeScript type. Faster to evolve and maps cleanly to the shape consumers actually use; analytical queries would need denormalization later.
- **Relational `bids` table** with `vehicle_id`, `amount`, `bidder_session`, `created_at`. Join-friendly if bid history gets surfaced.
- **Synthetic auction timestamps are normalized at load time** via a median-anchor offset so the demo always shows a balanced mix of upcoming, live, and ended auctions regardless of when it's run.
- **200 vehicles, fixed dataset.** No pagination or virtualization; the grid renders the full filtered list.

### Intentionally out of scope

Each of these was evaluated against the architecture — the foundation accommodates them cleanly — and sequenced out of this timebox in favor of depth on the core browse-inspect-bid flow.

- **Authentication and per-user accounts.** The challenge scopes auth as optional. The anonymous session model is deliberate: it keeps the prototype honest about what's being tested and adding Supabase auth is a well-understood next slice — swap `bidder_session` for `auth.uid()`, tighten the RLS policies, wire signup/signin. The architecture is ready.
- **Seller flows, checkout, payments, dealer admin.** Explicitly out of brief.
- **Proxy (max-bid) bidding.** The correct N-way implementation — server-side locks, tie-break ordering, buy-now protection against competing maxes — is a non-trivial backend slice that deserves its own scope. The `place_bid` RPC and `bids` schema are structured so adding a `max_amount` column plus a recompute-winner step lands cleanly.
- **AI-generated price estimates on listings.** OPENLANE operates in a regulated dealer context where a hallucinated dollar figure is the exact artifact a compliance team flags. I kept the AI surface that adds unambiguous buyer value — a 2-sentence condition synthesis — and linked to CarFax Canada for independent value verification (the domestic trust anchor). That framing produces a stronger walkthrough answer than a disclaimered estimate would.
- **Watchlist, comparison view, currency toggle.** Feature breadth. I prioritized depth on the core flow and real-time infrastructure; each of these is a natural additive slice.

## Stack

- **Frontend:** React 19, Vite 6, TypeScript (strict), Tailwind CSS 4, React Router v7, Lucide React
- **Backend:** Supabase — Postgres with RLS, real-time subscriptions, and a `place_bid` PL/pgSQL RPC (SECURITY DEFINER) that encodes bid validation, auction-window checks with evergreen timestamp normalization, and `jsonb_set` state patches in a single transaction. JSON fallback path handles zero-config local runs.
- **Database:** Supabase Postgres. `vehicles` uses a JSONB `data` column for schema-light evolution; `bids` is relational. Real-time publication enabled on `vehicles`.
- **Testing:** Vitest + React Testing Library (unit + component), Playwright (E2E).
- **Build + CI:** Biome (lint + format in one tool), GitHub Actions (Node 22), Vercel (auto-deploy from `main`).

## What I Built

A buyer-side vehicle auction app whose architecture is designed to stay clean as it grows.

**Four folders, each with one responsibility.** `pages/` orchestrates routes, `components/` holds reusable UI, `hooks/` owns data and state logic, `lib/` is pure functions plus the data layer. Zero circular dependencies; a new developer can orient themselves in five minutes. When a new feature lands this can be expanded based off common function and navigation.

**Data access behind a single interface.** The `dataStore` module exposes `getVehicles` / `getVehicle` / `subscribe` / `submitBid` regardless of which backend is active. Supabase mode sets up a real-time subscription and an atomic RPC call; JSON fallback mutates an in-memory array and notifies the same subscriber set. Hooks and components are backend-agnostic — adding a third backend (GraphQL, REST, gRPC) wouldn't change any consumer code. As additions like a second real-time domain (bid history, notifications, watchlist) or runtime validation at the boundary come in, the same contract splits cleanly into API (transport + parse), stores (state + subscriptions), and hooks.

**Derived state over stored state.** Auction status is computed from `auction_start` + the shared clock, not stored as a field. Filter/sort state lives in URL search params, not component state. The bid minimum derives from `current_bid ?? starting_bid`. This eliminates entire classes of sync bugs — there's no "status" to update when time passes, no local filter state to reconcile with the URL, no minimum to recompute on every render.

**Real-time built on subscriptions that survive refactors.** Every time-dependent surface (AuctionBadge, EndingSoonStrip countdowns, BidPanel, card timers) consumes a single `useNow()` hook backed by one `setInterval`. Every data-dependent surface consumes `useSyncExternalStore` against the `dataStore` subscriber set. Adding a new real-time feature — bid history feed, concurrent-bidder count, presence — reuses the same pattern.

**Typed error handling, not string parsing.** `BidError` is a discriminated union with three variants. The UI pattern-matches on `error.type` to render specific copy. Adding a new error type (e.g., `auth_required` once auth ships) is a one-line type change; TypeScript then surfaces every consumer that needs updating.

**Server-side atomicity where it matters.** The `place_bid` RPC validates, inserts, and patches vehicle state in a single transaction. Eliminates the TOCTOU race that client-orchestrated INSERT-then-UPDATE would expose under concurrent bidders. Complementary to RLS, not replacing it.

**AI enrichment as a batch-pipeline primitive.** [scripts/enrich.mjs](scripts/enrich.mjs) calls Claude Haiku 4.5 once per vehicle at build time, writes results back to the committed JSON, and exits non-zero if coverage is incomplete. Swap the prompt, rerun, the feature updates. No runtime coupling, no secrets in the client bundle, no LLM latency on the buyer's critical path. This mirrors how a real inventory pipeline would enrich listings during the inspection stage.

The result is an app where each new feature — auth, proxy bidding, watchlist, bid history, multi-currency — has an obvious integration point and composes with what's already there.

## Notable Decisions

**JSONB column for `vehicles` over a fully relational schema.** Vehicle data is read-heavy, evolves more than it gets aggregated, and maps one-to-one to the `Vehicle` TypeScript type. The JSONB shape lets the type and the data move together; it's the right call at prototype scale. For production reporting I'd denormalize the hot columns (year, make, body_style, starting_bid) while keeping JSONB for the rest.

**Atomic server-side RPC for bidding over client-orchestrated writes.** Doing `INSERT INTO bids` then `UPDATE vehicles` from the client trades correctness for simplicity — concurrent bidders race to clobber each other's `bid_count`. The `place_bid` RPC closes the race, validates on the server, and encodes the auction-window logic once. The tradeoff is a small amount of SQL to maintain in exchange for a correctness guarantee that holds under load. As bidding grows side effects — notifications, audit events, presence fanout — the RPC sits behind a backend service layer that owns orchestration; the client calls a single endpoint regardless of whether that layer is a serverless function, an edge worker, or a dedicated API.

**URL search params as the single source of truth for filter/sort state.** Shareable links, browser back-button works, no duplicate state to reconcile. The tradeoff is a small amount of encoding/decoding care at the boundary.

**No global state manager (Redux, Zustand, Context).** For two routes with no shared mutable client state, the module-level `dataStore` and URL search params cover every case. Props don't drill more than two levels within a page. The cost of adding state tooling later is lower than the cost of premature architecture now.

**Dual backend with JSON fallback over "Supabase required."** The first clone experience matters — the evaluator shouldn't need to provision a database to see the app. The JSON path serves the full feature set against in-memory state; Supabase adds persistence and real-time. Both code paths are honest about what they support; the [README.md](README.md) points evaluators at the Supabase demo for the full experience.

**Build-time AI enrichment over runtime generation with caching.** Runtime generation was considered. It would have required an API key in every evaluator's environment, a loading state on every detail page, and third-party uptime coupling during the walkthrough. Build-time enrichment mirrors how a real inventory pipeline enriches listings — batch, async, pre-computed — and keeps the demo offline-capable. In production I'd lift the same prompt and validation logic into an ingest-worker trigger off the inspection report.

**No AI-generated price on listings.** An appraisal-adjacent number rendered next to a real listing is what regulated-dealer-context compliance teams flag. The Condition Summary card carries no price claim; CarFax Canada is the trust anchor for value and is one click away.

**`sessionStorage` for bidder identity, not `localStorage`.** Closing the tab means "new bidder" — appropriate for an unauthenticated prototype, and real identity slots in cleanly when auth ships.

**`BidError` as a discriminated union, not string messages.** The UI pattern-matches on `error.type` to render specific copy. No string parsing, no silent swallowing of unknown errors, and new error types surface every consumer that needs updating at compile time.

**Named exports only, no default exports.** Import lists stay explicit, refactors and editor auto-import behave deterministically. [CLAUDE.md](CLAUDE.md) codifies it as a project-wide rule.

**Route-based code splitting over vendor chunking.** `VehiclePage` and `NotFoundPage` load via React Router v7's `lazy` field; Vite preloads the chunk on card hover via the router manifest. Scales with every new route; vendor chunks would rot as deps shift. A root-level route `ErrorBoundary` detects chunk-load failures across Chrome/Firefox/Safari and shows a branded Reload CTA for the stale-HTML-after-deploy case.

## Testing

- **244 unit and component tests** across 26 files. Every component has a co-located `.test.tsx`. Tests verify behavior through `screen.getByRole` and explicit user interactions, not implementation detail.
- **9 Playwright E2E flows** covering the three challenge flows, Buy Now, drawer a11y + focus restoration, theme persistence across reloads, category-chip replace semantics, `prefers-reduced-motion` compliance, and a reserve-price-leak guard.
- **TDD on the bidding flow specifically.** Highest-risk feature; tests locked in the contract before implementation.
- **E2E runs against the JSON fallback** — zero Supabase secrets needed in CI, reproducible by any evaluator.
- **Strict TypeScript, zero `any`, zero `@ts-ignore`, zero `@ts-expect-error`.** Biome handles both lint and format; CI gates on both.
- **CI is a two-job gated pipeline** — fast checks (typecheck + biome + vitest + build) must pass before Playwright runs; `playwright-report/` uploads as an artifact on failure.

One command runs the entire verification suite from `app/`:

```bash
npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e
```

## What I'd Do With More Time
- **A purpose-built `skill-creator`-authored feature skill.** Encoding patterns like "add a new filter category," "add a new sort option," or "add a new detail-page panel" as reusable skills would make the next addition a 5-minute task instead of 30 minutes. Also scaffolds multi-feature parallel development — several independent features shipped in the same pass through parallel implementation streams consuming the same skill.
- **Supabase auth for multi-user.** For production grade: replace `bidder_session` with `auth.uid()`, update RLS to check JWT claims, wire email + OAuth signup, add per-user surfaces (my bids, watchlist). The architecture is shaped to absorb it.
- **Proxy (max-bid) bidding with server-side locks.** For correct N-way semantics, buy-now ambush protection, and bid history surfacing. The `place_bid` RPC already owns bid-placement; extending it for a `max_amount` column and a recompute-winner step is the natural shape.
- **Richer buyer features** — watchlist, side-by-side comparison view, saved searches, per-model market context (median odometer per year+model bucket).
- **Inventory pagination + windowed virtualization.** The grid renders all 200 filtered cards today; `content-visibility: auto` keeps paint costs tolerable but the DOM still carries the full list. For 10 000+ vehicles the right shape is `?page=N` URL state (shareable, browser-back works) backing a 24-card page. Filters and sort reset to page 1; `<Pagination />` sits under the grid. Additive, no API breakage — URL default of `page=1` means existing shared links keep working.
- **Richer imagery.** Themed per-vehicle generated imagery replacing the dark placeholders.
- **Preview deployments per PR, Lighthouse budgets, automated dependency updates.** The Vercel-backed auto-deploy is working; richer CI is the next layer.
- **Multi-user real-time surface.** Public bid-history feed, concurrent-bidder count, Supabase presence channels. The `dataStore` subscription layer is already wired — only the UI surface was out of scope.
- **JSON-fallback proxy-bid phantom rival.** A deterministic per-vehicle ceiling that lets the offline demo actually demonstrate max-bid mechanics without Supabase.
