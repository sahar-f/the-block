# Architecture Design — The Block: OPENLANE Vehicle Auction Platform

## Context

Buyer-side vehicle auction prototype for the OPENLANE coding challenge. 200 synthetic vehicles from `app/data/vehicles.json`. Buyers browse inventory, inspect details, and place bids. Must work with `npm install && npm run dev` — no external services required. Supabase is optional for real-time and persistence.

This spec defines the architecture before any code is written. Every decision was brainstormed against edge cases including auction expiry mid-session, real-time bid conflicts, browser sleep/wake, and timestamp boundary precision.

---

## 1. Folder Structure

```
src/
  components/         — reusable UI components
    AuctionBadge.tsx        (+test)
    BidPanel.tsx            (+test)
    ConditionBadge.tsx      (+test)
    ConditionPanel.tsx      (+test)
    ErrorBoundary.tsx       (+test)
    FilterPanel.tsx         (+test)
    ImageGallery.tsx        (+test)
    SearchBar.tsx           (+test)
    Skeleton.tsx            (+test) 
    SortSelect.tsx          (+test)
    SpecsPanel.tsx          (+test)
    VehicleCard.tsx         (+test)
  hooks/              — custom hooks (architectural boundaries)
    useBid.ts               (+test)
    useFilters.ts           (+test)
    useNow.ts               (+test)
    useVehicle.ts           (+test)
    useVehicles.ts          (+test)
  lib/                — pure functions, utilities, constants, data layer
    auction.ts              (+test)  — getAuctionStatus, normalizeAuctionTimes
    clock.ts                         — module-level singleton, useSyncExternalStore adapter
    cn.ts                            — clsx + tailwind-merge
    constants.ts                     — MIN_BID_INCREMENT, AUCTION_DURATION_MS, etc.
    dataStore.ts                     — Supabase client OR JSON fallback, subscription manager
    filters.ts              (+test)  — parseFilters, serializeFilters, applyFilters
    format.ts               (+test)  — formatCurrency, formatOdometer, formatDate
  pages/              — route-level components (one per route)
    InventoryPage.tsx       (+test)
    VehiclePage.tsx         (+test)
    NotFoundPage.tsx        (+test)
  types.ts                           — all shared types
  App.tsx                            — router setup
  main.tsx                           — React root entry point
```

**4 folders, each justified:**
- `components/` — reusable UI pieces used across pages or >30 lines
- `hooks/` — custom hooks, one concern per hook
- `lib/` — pure functions, utilities, constants, data access
- `pages/` — route-level orchestrators, one per route

**Why flat:** 3 routes, ~14 components, 5 hooks, ~7 lib files. Feature grouping adds navigation overhead without benefit. A new developer opens `src/` and sees everything organized by role.

---

## 2. State Management

**No React Context. Local state + hooks + URL params covers everything.**

| State | Location | Why |
|-------|----------|-----|
| Filter/search/sort | URL search params (`useFilters`) | Shareable, survives refresh, browser nav works |
| Vehicle list | `useVehicles` hook (derived from filters) | Fetched/filtered on every filter change |
| Single vehicle | `useVehicle(id)` hook | Fetched per detail page, real-time subscription in Supabase mode |
| Bid form input | Local component state in `BidPanel` | Ephemeral, only matters in the bid panel |
| Bid submission | `useBid` → `dataStore.submitBid()` | Supabase mutation or in-memory update |
| Auction status | Derived from `getAuctionStatus(auctionStart, now)` | Computed every tick from shared clock, never stored |
| Current time | `useNow()` → `clock.ts` singleton | Single source of truth for all time-dependent rendering |

**Why no Context:** The two main routes don't share mutable state. Inventory has its own filtered list. Detail fetches one vehicle by ID. No global cart or cross-route selection. Props never drill deeper than 2 levels within a page.

**Bid state in fallback mode:** In-memory mutation of the vehicles array held in `dataStore.ts`. Resets on refresh — acceptable for a prototype. CLAUDE.md forbids localStorage for bid state.

---

## 3. Data Flow

### `lib/dataStore.ts` — Module-Level Data Access

**Not a hook.** A module that initializes once on import and exports functions.

**Two code paths behind one interface:**

```
if VITE_SUPABASE_URL is set:
  → create Supabase client (once, module-level)
  → set up single real-time subscription to vehicles table (once)
  → writes updates into module-scoped Map<string, Vehicle>
else:
  → import vehicles.json into module-scoped let vehicles: Vehicle[]
  → normalize auction timestamps (once, on import)
```

**Exported interface:**
- `getVehicles(): Vehicle[]` — returns full list (filtering happens in hooks)
- `getVehicle(id: string): Vehicle | null` — single lookup
- `submitBid(id: string, amount: number): Promise<BidResult>` — mutation
- `subscribe(callback: () => void): () => void` — returns unsubscribe function

**Subscribe contract:** Returns an unsubscribe function, matching `useSyncExternalStore`'s expected signature. Hooks pass it through directly. React handles cleanup on unmount — no stale callbacks.

**Why one module, not a hook:** Multiple components calling a hook would each create their own Supabase subscription. Module-level initialization guarantees one client, one subscription, shared across all consumers.

### Hook Dependency Chain

```
useFilters()          → parses URL search params → returns typed FilterState + setters
useVehicles(filters)  → reads dataStore + subscribes → applies filters/sort → returns Vehicle[]
useVehicle(id)        → reads dataStore + subscribes → returns single Vehicle | null
useBid(vehicleId)     → calls dataStore.submitBid → returns submit function + state
useNow()              → reads clock.ts singleton → returns current timestamp
```

No circular dependencies. Each hook has one job.

### Consistent Hook Return Shape

Every data-fetching hook returns:

```ts
{ data: T, isLoading: boolean, error: string | null }
```

| Hook | `data` type | `error` cases |
|------|-------------|---------------|
| `useVehicles(filters)` | `Vehicle[]` (empty array, never null) | Supabase fetch failure, JSON import failure |
| `useVehicle(id)` | `Vehicle \| null` | Fetch failure, vehicle not found (data=null, error=null, isLoading=false) |

**`useBid` is a mutation, different shape:**

```ts
{
  submit: (amount: number) => Promise<void>,
  isPending: boolean,
  error: BidError | null,
  lastBid: Bid | null
}
```

**`BidError` is a discriminated union:**

```ts
type BidError =
  | { type: 'auction_ended'; message: string }
  | { type: 'bid_too_low'; minimum: number; message: string }
  | { type: 'network'; message: string }
```

This gives the bid panel enough context to render specific messages without string parsing.

**Not-found vs error in `useVehicle`:**
- Loading: `{ data: null, isLoading: true, error: null }` → show skeleton
- Not found: `{ data: null, isLoading: false, error: null }` → redirect to 404
- Error: `{ data: null, isLoading: false, error: "..." }` → show error message
- Success: `{ data: Vehicle, isLoading: false, error: null }` → render page

---

## 4. Component Breakdown

### Inventory Route (`/`)

| Component | Responsibility | Budget |
|-----------|---------------|--------|
| `InventoryPage` | Orchestrates filters + grid. Calls `useFilters` + `useVehicles`. Loading/empty/error states. | ~80 lines |
| `SearchBar` | Text input bound to `useFilters().setQuery`. Debounced. | ~40 lines |
| `FilterPanel` | Dropdowns for body_style, province, drivetrain, fuel_type, transmission, title_status, auction status, price range, condition range. | ~120 lines |
| `SortSelect` | Sort dropdown: price asc/desc, year, condition, ending soonest, most bids. | ~35 lines |
| `VehicleCard` | Single card: title, image, price, bid count, condition badge, auction badge, lot, location, dealership. Calls `useNow()` + `getAuctionStatus()` for live badge. | ~80 lines |
| `AuctionBadge` | "Live" (pulse) / "Upcoming" / "Ended" badge. Pure, takes status prop. | ~30 lines |
| `ConditionBadge` | Color-coded grade: green ≥4, yellow 3-4, red <3. Pure. | ~25 lines |

### Detail Route (`/vehicles/:id`)

| Component | Responsibility | Budget |
|-----------|---------------|--------|
| `VehiclePage` | Orchestrator: fetch vehicle, loading/error/not-found, layout panels. Calls `useVehicle(id)` + `useNow()`. | ~130 lines |
| `ImageGallery` | Thumbnail strip + main image display. Click to switch. | ~70 lines |
| `SpecsPanel` | Key-value grid: engine, transmission, drivetrain, fuel_type, odometer, body_style, colors. | ~60 lines |
| `ConditionPanel` | Condition grade badge + report text + damage notes list with warning icons. | ~50 lines |
| `BidPanel` | Current bid (large amber), bid count, starting bid, reserve status, bid input, submit button, buy now. Handles real-time bid updates, "ended while away" message, typed error messages. Sticky on mobile. | ~100 lines |

**ConditionPanel / SpecsPanel separation justification:** They represent distinct buyer trust signals — specs answer "what am I buying," condition answers "what's wrong with it." Different data shapes (key-value pairs vs grade + prose + damage list), different visual treatments, independent test suites.

### Shared

| Component | Responsibility | Budget |
|-----------|---------------|--------|
| `ErrorBoundary` | Catches render errors per route. User-friendly message. | ~40 lines |
| `Skeleton` | Loading skeleton variants matching content shapes. | ~40 lines |
| `NotFoundPage` | 404 with "Browse all vehicles" CTA. | ~25 lines |

**Totals:** ~14 component files, 5 hook files, 7 lib files, 1 types file, 2 app files = ~29 files in `src/`.

---

## 5. Auction State Machine

### Timestamp Normalization

On initial load, shift all `auction_start` values so the dataset has a natural mix of upcoming, live, and ended auctions.

**Strategy: median anchor.**
- Sort all `auction_start` values
- Pick the lower median: index `Math.floor((n - 1) / 2)` for 200 vehicles = index 99
- Compute `offset = Date.now() - medianAuctionStart`
- Add `offset` to every `auction_start`

**Why median, not earliest:** Shifting from earliest would cluster most auctions in the future. Median gives ~50% past (ended/live) and ~50% future (upcoming/live) — a balanced, realistic spread.

**Why lower median:** For even-length arrays, averaging the two middle values could produce a timestamp not in the dataset and a fractional millisecond offset. Index 99 is deterministic and clean.

Normalization happens once in `dataStore.ts` on initial data load, before any consumer sees the data.

### State Machine — Pure Function

```
lib/auction.ts

getAuctionStatus(auctionStart: number, now: number)
  → { status: 'upcoming' | 'live' | 'ended', timeRemaining: number }
```

**Rules (from CLAUDE.md, with precise boundaries):**
- `upcoming`: `auctionStart > now` → `timeRemaining` = ms until live
- `live`: `auctionStart <= now && auctionStart + AUCTION_DURATION_MS > now` → `timeRemaining` = ms until ended
- `ended`: `auctionStart + AUCTION_DURATION_MS <= now` → `timeRemaining` = 0

**Boundary at exactly `auctionStart + 4hrs`:** The `live` condition uses strict `>` for the end bound. At the exact boundary millisecond, `live` is false, `ended` is true. No overlap, no gap. Every millisecond maps to exactly one state.

### Single Clock Architecture

**`lib/clock.ts`** — module-level singleton:
- One `setInterval(1000)` updates a module-scoped `now = Date.now()`
- Starts lazily on first subscriber, stops when none remain
- Exports `subscribe(callback): () => void` and `getSnapshot(): number`

**`hooks/useNow.ts`** — thin wrapper:
- `useSyncExternalStore(clock.subscribe, clock.getSnapshot)`
- Returns the shared `now` value
- Every component calling `useNow()` gets the exact same value on the same tick

**All auction status is derived, never stored:**
- Components call `useNow()` to get `now`
- Pass `now` to `getAuctionStatus(auctionStart, now)`
- No component-level timers, no `setInterval` in hooks, no drift between components

**Browser sleep/wake:** `setInterval` pauses when the tab is backgrounded. On wake, the first tick calls `Date.now()` which returns real wall-clock time. The `now` value jumps to current time in one tick. `getAuctionStatus` computes correctly against the fresh `now`. No stale state — the clock doesn't track elapsed ticks, it reads the real clock.

---

## 6. URL Filter State Design

**Single source of truth: URL search params.**

### `hooks/useFilters.ts`

Wraps `useSearchParams` from React Router. Returns a typed `FilterState` object and setter functions.

**`FilterState` type:**

```ts
type FilterState = {
  query: string
  bodyStyle: string[]
  province: string[]
  drivetrain: string[]
  fuelType: string[]
  transmission: string[]
  titleStatus: string[]
  auctionStatus: ('upcoming' | 'live' | 'ended')[]
  priceMin: number | null
  priceMax: number | null
  conditionMin: number | null
  conditionMax: number | null
  sort: SortOption
}

type SortOption = 'price_asc' | 'price_desc' | 'year_desc' | 'condition_desc' | 'ending_soon' | 'most_bids'
```

### `lib/filters.ts` — Parse, Serialize, Apply

**`parseFilters(searchParams: URLSearchParams): FilterState`**
- Reads each param with validation and type coercion
- Invalid values silently fall back to defaults (empty string, empty array, null)
- Unknown params are ignored (no crash on `?foo=bar`)
- Number params validated: `priceMin` must be non-negative, `conditionMin` between 0-5

**`serializeFilters(filters: FilterState): URLSearchParams`**
- Strips default values from URL (clean URLs — no `?query=&sort=price_asc`)
- Array values joined with commas: `?bodyStyle=SUV,sedan`
- Only non-default values appear in the URL

**`applyFilters(vehicles: Vehicle[], filters: FilterState, now: number): Vehicle[]`**
- Pure function: takes full vehicle array + filters + current time, returns filtered + sorted array
- Text search: case-insensitive match on make, model, year (toString), VIN, lot
- Each filter is an AND condition (all must match)
- Within array filters (e.g., bodyStyle), values are OR (SUV or sedan)
- Sort uses `now` for "ending soonest" (derived auction time remaining)
- Returns new array, never mutates input

### Setter Pattern

```ts
const { filters, setQuery, setFilter, setSort, clearFilters } = useFilters()
```

- `setQuery(value)` — updates `?query=` param, debounced in `SearchBar`
- `setFilter(key, value)` — toggles a filter value in the URL
- `setSort(option)` — updates `?sort=` param
- `clearFilters()` — removes all params, resets to defaults
- All setters use `setSearchParams` with `replace: true` to avoid polluting browser history with every keystroke

---

## 7. Edge Case UX

### Auction Ended While User Was Away

When a user returns to a backgrounded tab and the auction has ended:

- Track previous status in `useRef` inside `BidPanel`
- On status transition `live → ended`: check if `timeRemaining` jumped by >30 seconds between ticks (indicates sleep/background, not natural countdown)
- If jumped: replace the bid form with inline message: **"This auction ended while you were away. Final price: $XX,XXX."**
- If counted down naturally: standard transition, no extra message — user watched it happen
- Message stays until navigation, not a toast

### Bid Rejected at Auction Boundary

When a bid is submitted and the auction ended milliseconds ago:

- `useBid.submit()` checks `getAuctionStatus(auctionStart, Date.now())` before attempting mutation
- If ended: returns `{ type: 'auction_ended', message: 'This auction just ended — your bid couldn\'t be placed.' }` without hitting the server
- BidPanel renders this distinctly from validation errors — empathetic message paired with final price
- In Supabase mode: second guard via RLS/check constraint. Server rejection mapped to same typed error

### Real-Time Bid Arrives While User Types

When a Supabase real-time event updates `current_bid` while the user is filling the bid input:

1. Current bid display updates with highlight animation
2. Bid count increments
3. Minimum bid helper text updates: "Minimum: $X,XXX"
4. **User's typed input is NOT cleared or modified**
5. If typed amount < new minimum: input border turns red, helper text shows new minimum
6. Submit button validates against latest `current_bid` at click time

The user sees the market move, understands the price went up, adjusts. No surprise rejection.

---

## 8. Key Constants

```ts
// lib/constants.ts
const MIN_BID_INCREMENT = 100
const AUCTION_DURATION_MS = 4 * 60 * 60 * 1000  // 4 hours
const CLOCK_INTERVAL_MS = 1000
const AWAY_THRESHOLD_MS = 30_000  // detect sleep/background gap
const SEARCH_DEBOUNCE_MS = 300
```

### Bidder Session Identity

No auth in scope. Bids are tagged with a `bidder_session` — a random UUID generated once per browser session via `crypto.randomUUID()`, stored in `sessionStorage`. Not `localStorage` (CLAUDE.md forbids it for bid state, and a session-scoped identity is more appropriate — closing the tab means a new "bidder"). In fallback mode the session ID is still generated but effectively unused since there's one implicit user. The session ID is never displayed to the user or used for access control — it exists solely to tag rows in Supabase for potential future bid history queries.

---

## 9. Types

```ts
// types.ts
type Vehicle = {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim: string
  body_style: string
  exterior_color: string
  interior_color: string
  engine: string
  transmission: string
  drivetrain: string
  odometer_km: number
  fuel_type: string
  condition_grade: number
  condition_report: string
  damage_notes: string[]
  title_status: string
  province: string
  city: string
  auction_start: string  // ISO 8601, normalized on load
  starting_bid: number
  reserve_price: number | null
  buy_now_price: number | null
  images: string[]
  selling_dealership: string
  lot: string
  current_bid: number | null
  bid_count: number
}

type AuctionStatus = 'upcoming' | 'live' | 'ended'

type AuctionState = {
  status: AuctionStatus
  timeRemaining: number
}

type Bid = {
  id: string
  vehicle_id: string
  amount: number
  bidder_session: string
  created_at: string  // ISO 8601
}

type BidError =
  | { type: 'auction_ended'; message: string }
  | { type: 'bid_too_low'; minimum: number; message: string }
  | { type: 'network'; message: string }

type BidResult =
  | { success: true; bid: Bid }
  | { success: false; error: BidError }

type FilterState = {
  query: string
  bodyStyle: string[]
  province: string[]
  drivetrain: string[]
  fuelType: string[]
  transmission: string[]
  titleStatus: string[]
  auctionStatus: AuctionStatus[]
  priceMin: number | null
  priceMax: number | null
  conditionMin: number | null
  conditionMax: number | null
  sort: SortOption
}

type SortOption =
  | 'price_asc'
  | 'price_desc'
  | 'year_desc'
  | 'condition_desc'
  | 'ending_soon'
  | 'most_bids'
```

---

## 10. Verification Plan

### After scaffolding (before any features):
- `npm install` succeeds
- `npm run dev` starts dev server
- `npx tsc --noEmit` passes
- `npx biome check .` passes
- `npm run build` succeeds

### After each feature:
- Co-located `.test.tsx` passes via `npx vitest run`
- TypeScript strict mode passes
- Biome lint/format passes
- Build succeeds
- Manual browser verification of the feature

### End-to-end (before submission):
- All unit/integration tests pass
- 3 Playwright E2E flows pass:
  1. Search "Ford" → results → click vehicle → detail loads
  2. Open live vehicle → place bid → confirm → state updates
  3. Filter SUV → sort price low → verify order
- `npm run build` produces clean output
- App works with no env vars (JSON fallback)
- App works with Supabase env vars (real-time mode)

---

## Critical Files to Create/Modify

**New files (all in src/):**
- `lib/clock.ts` — singleton clock
- `lib/dataStore.ts` — data access layer with Supabase/JSON dual backend
- `lib/auction.ts` — pure auction state machine + normalization
- `lib/filters.ts` — filter parsing, serialization, application
- `lib/format.ts` — currency, odometer, date formatting
- `lib/cn.ts` — clsx + tailwind-merge
- `lib/constants.ts` — all named constants
- `hooks/useNow.ts` — shared clock hook
- `hooks/useFilters.ts` — URL search params wrapper
- `hooks/useVehicles.ts` — filtered vehicle list
- `hooks/useVehicle.ts` — single vehicle + subscription
- `hooks/useBid.ts` — bid submission + validation
- `types.ts` — all shared types
- `App.tsx` — React Router setup
- `main.tsx` — entry point
- All components and pages listed in section 4

**Config files (project root):**
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `biome.json`
- `.env.example`
- `index.html` (with Google Fonts)
- `playwright.config.ts`
