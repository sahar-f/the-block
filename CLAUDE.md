# CLAUDE.md — The Block: OPENLANE Vehicle Auction Platform

## Project Overview
Buyer-side vehicle auction web app for the OPENLANE coding challenge as outlined in README.md.
200 synthetic vehicles from `app/data/vehicles.json`. Buyers browse inventory,
inspect vehicle details, and place bids.

This is a prototype. Optimize for **clarity over surface area**. Every line of
code should earn its place. Fewer features done exceptionally well beats many
features done adequately.

## Core Principles
1. **Minimal code** — Do not write code that can be written or well designed in fewer lines.
   Add abstraction only when it is well designed and follows the codebase architecture.
   No premature optimization. No unnecessary files. 
2. **Clear architecture** — a new developer should understand the codebase in
   5 minutes by reading the folder structure and this file.
3. **Thorough testing** — every component tested, every business rule verified,
   every critical flow covered end-to-end.
4. **Security by default** — sanitize inputs, validate on both client and server,
   no secrets in code, no dangerouslySetInnerHTML, no eval.
5. **Intentional design** — every visual decision is deliberate. Nothing looks
   accidental. The UI should feel designed, not generated. It must impress.
6. **Verify** — Verify, evaluate, and simplify every change using a subagent - iterate until no possible bugs, major gaps, or errors can be introduced.

## Tech Stack
- **Framework**: React 19, functional components, hooks only
- **Build**: Vite 6, TypeScript strict mode
- **Styling**: Tailwind CSS 4, utility-first, mobile-first
- **Backend**: Supabase (Postgres + real-time + RLS)
- **Routing**: React Router v7
- **Testing**: Vitest + React Testing Library + Playwright
- **Linting**: Biome (replaces ESLint + Prettier)
- **Icons**: Lucide React
- **Deploy**: Vercel free tier

## Project Structure
Architecture is defined in `docs/ARCHITECTURE.md`. Read it before writing code.

Structural rules:
- Keep structure as flat as possible until complexity demands nesting
- Don't create folders for single files
- Don't create index.ts barrel files
- Co-locate tests next to source files (.test.tsx alongside .tsx)
- Shared hooks, utilities, types, and constants at the src/ level
- Data fallback file (vehicles.json) accessible from src/

## Routes
- `/` — Inventory (browse, search, filter, sort)
- `/vehicles/:id` — Vehicle detail + bidding
- `*` — 404 page

## Code Rules
- Keep files concise and focused. If a file grows unwieldy, split it — but
  prioritize quality and completeness over arbitrary line counts.
- One component per file. Named exports only.
- No `any`. No `@ts-ignore`. No `@ts-expect-error`.
- Descriptive props type names (`VehicleCardProps` not `Props`).
- cn() helper (clsx + tailwind-merge) for conditional classes.
- Early returns over nested conditionals.
- Prefer `type` over `interface`.
- Destructure props in function signature.
- Tailwind utility classes only — no inline styles, no CSS files.
- Extract magic numbers into named constants.
- Delete dead code immediately. No commented-out code.
- Look out for bugs and prevent them from being introduced.

## Naming Conventions
- Components: `VehicleCard.tsx` (PascalCase)
- Hooks: `useVehicles.ts` (camelCase, `use` prefix)
- Utility files: `format.ts`, `auction.ts` (camelCase, grouped by domain)
- Types: `Vehicle` (PascalCase, no `I` prefix)
- Tests: `VehicleCard.test.tsx` (co-located)
- Constants: `MIN_BID_INCREMENT` (SCREAMING_SNAKE_CASE)

## Component Pattern
```tsx
type VehicleCardProps = {
  vehicle: Vehicle;
  onBid?: (id: string) => void;
};

export function VehicleCard({ vehicle, onBid }: VehicleCardProps) {
  // 1. Hooks
  // 2. Derived state / computed values
  // 3. Event handlers
  // 4. Early returns (loading, error, empty)
  // 5. Render
}
```

## State Management
- Use the simplest approach that works — start with local state + props
- Lift state up only when multiple components need it
- Introduce React Context only if prop drilling becomes unwieldy
- Custom hooks for ALL data fetching and business logic
- No Redux, Zustand, Jotai, or external state libraries
- See `docs/ARCHITECTURE.md` for the decided state strategy and data flow

## Routing and Code Splitting
- Non-landing routes use React Router v7's native `lazy` field (`/vehicles/:id`, `*`)

## Security
- Sanitize all user inputs (bid amounts, search queries)
- Validate bid amounts on client AND server (Supabase RLS + check constraints)
- No dangerouslySetInnerHTML anywhere
- No eval() or Function() constructors
- Environment variables for all secrets (Supabase URL/key)
- .env never committed — .env.example documents required vars
- Supabase Row Level Security enabled on all tables
- Input type="number" with min/max/step for bid amounts
- Double check for sensitive strings, files, or packages that should not be committed
- Add sensitive files to .gitignore
- sessionStorage permitted only for anonymous session ID (not bid state)

## Design System

### Philosophy
Premium automotive auction house. Not flashy — **confident and refined**.
Every element should feel intentional, not generated. The design should
build trust — buyers are making high-value purchase decisions.
This UI will be shown to interviewers — it must look exceptional.

### Colors (light-first with dark mode via `.dark` class on `<html>`)
- **Page**: #F9FAFB (light) / #030712 (dark) · **Surfaces**: #FFFFFF / #111827 · **Surface hover**: #F9FAFB / #1F2937
- **Text**: #111827 (primary), #4B5563 (secondary), #6B7280 (muted — use ≥14 px at 500+ weight for contrast)
- **Accent**: #4F46E5 indigo-600 + #9333EA purple-600 (gradient applied via `.text-accent-gradient` / `.bg-accent-gradient`)
- **Accent hover**: #4338CA indigo-700 · **Dark accent**: #818CF8 indigo-400 / #C084FC purple-400
- **Hero**: #4F46E5 → #9333EA → #DB2777 gradient band on the inventory page
- **Success**: #16A34A · **Error**: #DC2626 · **Warning**: #D97706
- **Border**: rgba(0,0,0,0.08) / rgba(255,255,255,0.08) · **Border hover**: rgba(0,0,0,0.15) / rgba(255,255,255,0.15)

### Typography
- **Headings**: "Outfit", sans-serif (600 weight) — confident, modern
- **Body**: "DM Sans", sans-serif (400, 500) — clean, readable
- **Mono**: "JetBrains Mono" (VIN, lot numbers, bid amounts) — precision, data feel
- Load via Google Fonts in index.html

### Layout
- Max width: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Card padding: p-6 · Grid gap: gap-6 cards, gap-8 sections
- Radius: rounded-3xl on cards (VehicleCard, StatsBar, EndingSoonStrip, VehiclePage container), rounded-2xl on panels (Specs/Condition/AI summary/BidPanel blocks), rounded-xl on pills/inputs, rounded-full on badges/circle buttons

### Responsive (mobile-first)
- Base: 1 column · `sm:` 2 columns · `lg:` 3 columns · `xl:` 3-4 columns

### Interactive States
- Card hover: `motion.div whileHover={{ y: -8 }}` + shadow-2xl + subtle gradient overlay
- Button hover: brightness-105 · Button disabled: opacity-50 cursor-not-allowed
- Focus: ring-2 ring-indigo-500 ring-offset-2 ring-offset-page (migrated from amber-500)
- Live auction: pulsing green dot (animate-pulse)
- Price display: JetBrains Mono, indigo→purple gradient text, prominent sizing

### Animations (subtle, purposeful, impressive)
- Card hover: 200ms ease-out with subtle ambient glow
- Card entrance: staggered opacity + translateY on initial load (CSS animation-delay)
- Modal: backdrop opacity 200ms + content slide-up 300ms
- Bid confirmation: green checkmark scale-in 300ms
- Image gallery: crossfade 150ms between images
- Skeleton: shimmer gradient animation on load
- Respect prefers-reduced-motion

## Accessibility
- Visible focus rings on ALL interactive elements
- Alt text on all images · ARIA labels on buttons and inputs
- Modal: trap focus, return on close
- Heading hierarchy: h1 → h2 → h3, no skips
- Keyboard: tab through everything · Touch targets: 44px minimum
- Color contrast: 4.5:1 minimum (verify muted text #71717A on dark surfaces)

## Error Handling
- ErrorBoundary on each route
- try/catch on all async operations
- Loading: Skeleton components matching content shape
- Empty: friendly message + "Clear filters" or "Browse all" CTA
- Error: user-friendly message, never raw errors or stack traces

## Testing
- Co-located .test.tsx for every component
- Test behavior, not implementation
- screen.getByRole() preferred
- Vitest + RTL for unit/integration (configure `passWithNoTests: true`)
- Playwright for 3 E2E flows:
  1. Search "Ford" → results → click vehicle → detail loads correctly
  2. Open live vehicle → place bid → confirm → state updates
  3. Filter SUV → sort price low → verify order
- Run ALL checks before every commit: tests, tsc, biome, build

## Vehicle Data — All Fields to Display

### Inventory card must show:
- year, make, model, trim (title)
- Placeholder image (first from images array)
- current_bid or starting_bid if no bids (price in amber mono)
- bid_count
- condition_grade (color-coded badge: green ≥4, yellow 3-4, red <3)
- Auction status badge (Live with pulse / Upcoming / Ended)
- lot number (mono font)
- city, province (location)
- selling_dealership

### Detail page must show:
- All images from images array (gallery/carousel)
- year, make, model, trim (h1)
- lot, VIN (mono font)
- **Specs**: engine, transmission, drivetrain, fuel_type, odometer_km (formatted with commas + "km"), body_style, exterior_color, interior_color
- **Condition**: condition_grade (badge), condition_report (text), damage_notes (list with warning icons, or "No damage reported" if empty)
- **Auction**: status badge, current_bid (large amber), bid_count, starting_bid, reserve status, buy_now_price (if set)
- **Dealership**: selling_dealership, city, province
- **Bid action**: prominent button, sticky on mobile
- **AI Condition Summary**: condition_summary — 2-sentence AI-generated condition read.

## Business Logic

### Constants
```
MIN_BID_INCREMENT = 100
AUCTION_DURATION_MS = 4 * 60 * 60 * 1000  // 4 hours
CLOCK_INTERVAL_MS = 1000
AWAY_THRESHOLD_MS = 30_000
SEARCH_DEBOUNCE_MS = 300
FEATURED_CONDITION_THRESHOLD = 4.5
```

### Bid Rules
- MIN_BID_INCREMENT = 100
- New bid must exceed current_bid by MIN_BID_INCREMENT
- If no bids: minimum bid = starting_bid (NOT starting_bid + increment)
- Buy Now at buy_now_price (if set, auction must be live) — skips increment validation
- Reserve display:
  - reserve_price is null → "No Reserve" (neutral badge)
  - current_bid >= reserve_price → "Reserve Met" (green badge)
  - current_bid < reserve_price → "Reserve Not Met" (muted badge)
  - NEVER show the actual reserve_price value
- After bid: increment bid_count, update current_bid, persist to Supabase
- Bid validation produces typed BidError discriminated union, not string messages
- formatCurrency takes number only — components handle the null check
  (show current_bid if it exists, else starting_bid, before calling the formatter)
- **Featured badge**: a vehicle card renders a Sparkles "Featured" pill when
  `condition_grade >= FEATURED_CONDITION_THRESHOLD` AND `auction_status === "live"`

### Auction State Machine
- `upcoming`: auction_start > now → countdown, no bidding
- `live`: auction_start <= now AND auction_start + AUCTION_DURATION_MS > now → bidding enabled
- `ended`: auction_start + AUCTION_DURATION_MS <= now → show final price, no bidding
- At exact boundary (start + duration = now): status is `ended` (strict > on end bound)
- Normalize auction times relative to Date.now() on initial load

### Search & Filter
- **Text**: case-insensitive on make, model, year (String(year)), VIN, lot
- **Filters**: body_style, price range, condition_grade range, province,
  drivetrain, fuel_type, transmission, title_status, auction status
- **Sort**: price asc/desc, year newest, best condition, ending soonest, most bids
- Filter state lives in URL search params (shareable, bookmarkable)
- Debounce happens in SearchBar component, not in the hook

## Data Fallback
If Supabase env vars are not set, load vehicles from the local JSON file.
The app MUST work when cloned and run with just `npm install && npm run dev`
— no external services required. This is the evaluator's first experience.

## README Requirements
The project README must include:
- Live demo link (Vercel URL)
- Quick start: clone → cd app → npm install → npm run dev (works without Supabase)
- Environment variables for optional Supabase setup
- Tech stack with reasoning
- Architecture overview
- AI workflow section (all tools used and how)
- Product decisions and tradeoffs
- Testing instructions
- What you'd improve with more time

## SUBMISSION.md Requirements
Fill out the challenge's submission template with:
- Time spent (with rough breakdown by phase)
- What was built (features implemented)
- What was intentionally cut and why
- Notable product and technical decisions
- Tech stack choices with reasoning
- How AI tools were used (brief — point to README for detail)
- What you'd improve with more time

## Walkthrough Preparedness
The 45-60 min walkthrough has 5 sections. The codebase should make each easy:
- **Demo (5 min)**: The app must tell its own story. Clean flows, no bugs.
- **Decisions (15 min)**: Every tradeoff documented in README or SUBMISSION.md.
- **Code (15 min)**: Have 2-3 pieces of code you're proud of — a custom hook,
  the bid validation logic, the data fallback pattern. Keep them clean.
- **Workflow (15 min)**: Git history should show atomic AI-assisted commits.
  CLAUDE.md + AI tools section = your workflow story.
- **Questions (5 min)**: Prepare 2-3 questions about the team and platform.

## Git
feat: / fix: / test: / refactor: / style: / docs: / chore:

## AI Tools
 
### Skills
- **Anthropic Frontend Design** — distinctive, premium UI generation. Anti-AI-slop aesthetic guidance.
 
### MCP Servers
- **Context7** — live library documentation (Vite, Tailwind, React Router, Supabase, Playwright)
- **Figma** — read the design file's source + screenshots directly (`get_design_context`, `ReadMcpResource`); turn designers' Figma Make exports into reference code without screenshotting-and-guessing
- **Supabase** — database operations, RLS, seeding
- **Playwright** — visual verification screenshots, E2E test debugging (added at test time)
- **Vercel** — deployment, env vars, deployment logs (added at deploy time)
 
### Usage Pattern
1. Before any feature: Context7 for current library docs
2. Before any UI: Read frontend-design skill
3. Design-driven UI work: Figma MCP to pull the exact design context (tokens, component code, screenshots) from the source file — then adapt to our component/token system rather than copying
4. Building: frontend-design aesthetic direction + CLAUDE.md design tokens
5. Testing: TDD for bidding. Playwright MCP for visual verification.
6. Quality: Accessibility audit on each page
7. Data: Supabase MCP for all database operations
8. Deploy: Vercel MCP for deployment and log checking
9. Build-time data enrichment: enrich script pre-computes condition_summary per vehicle via `@anthropic-ai/sdk`.
 
## Do NOT
- Use `any`, `@ts-ignore`, `@ts-expect-error`
- Add auth, seller flows, payments, checkout
- Use class components or default exports
- Use inline styles or CSS files
- Import from barrel/index files
- Use localStorage for bid state (sessionStorage for session ID only)
- Use dangerouslySetInnerHTML or eval
- Show raw errors to users
- Skip loading or empty states
- Commit .env or secrets
- Leave dead or commented-out code
- Add unnecessary dependencies
- Over-abstract — keep it simple
 