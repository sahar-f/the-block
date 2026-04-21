import { AlertCircle, SearchX } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { CategoryChips } from "../components/CategoryChips";
import { EndingSoonStrip } from "../components/EndingSoonStrip";
import { FilterPanel } from "../components/FilterPanel";
import { SearchBar } from "../components/SearchBar";
import { SiteHeader } from "../components/SiteHeader";
import { VehicleCardSkeleton } from "../components/Skeleton";
import { SortSelect } from "../components/SortSelect";
import { StatsBar } from "../components/StatsBar";
import { VehicleCard } from "../components/VehicleCard";
import { useFilters } from "../hooks/useFilters";
import { useNow } from "../hooks/useNow";
import { useVehicles } from "../hooks/useVehicles";
import { hasActiveFilters } from "../lib/filters";

const SKELETON_COUNT = 8;
const GRID_CLASSES =
	"mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:grid-cols-3 2xl:grid-cols-4";

export function InventoryPage() {
	const {
		filters,
		setQuery,
		setFilter,
		setSort,
		setRange,
		clearFilters,
		setBodyStyleOnly,
	} = useFilters();
	const now = useNow();
	const { data, allVehicles, isLoading, error } = useVehicles(filters, now);
	const filtersActive = hasActiveFilters(filters);

	useEffect(() => {
		document.title = "The Block | Inventory";
	}, []);

	if (error) {
		return (
			<>
				<SiteHeader />
				<main className="bg-page-gradient min-h-screen px-4 py-24 sm:px-6 lg:px-8">
					<div className="mx-auto flex max-w-3xl flex-col items-center text-center">
						<AlertCircle className="mb-4 size-12 text-error" />
						<h2 className="font-heading text-xl font-semibold text-text-primary">
							Something went wrong
						</h2>
						<p className="mt-2 text-sm text-text-secondary">{error}</p>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<SiteHeader />
			<main className="bg-page-gradient">
				<motion.section
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5 }}
					className="bg-hero-gradient relative overflow-hidden py-20 text-white md:py-28"
				>
					<div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
						<motion.div
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="text-center"
						>
							<h1 className="font-heading text-5xl font-bold leading-tight md:text-7xl">
								Live Vehicle Auctions
								<span className="mt-2 block text-3xl text-white/80 md:text-5xl">
									Bid Before the Block Drops.
								</span>
							</h1>
							<p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 md:text-xl">
								Browse vehicles from Canadian dealerships. Bid with confidence.
							</p>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.15 }}
							className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-3xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-2xl sm:flex-row sm:items-stretch"
						>
							<div className="flex-1">
								<SearchBar value={filters.query} onChange={setQuery} />
							</div>
							<FilterPanel
								filters={filters}
								onFilterChange={setFilter}
								onRangeChange={setRange}
								onClear={clearFilters}
							/>
						</motion.div>

						<CategoryChips
							current={filters.bodyStyle}
							onSelect={setBodyStyleOnly}
						/>
					</div>

					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-page to-transparent" />
				</motion.section>

				<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
					<div className="space-y-4">
						<EndingSoonStrip vehicles={allVehicles} now={now} />
						<StatsBar vehicles={allVehicles} now={now} />
					</div>

					<div className="mt-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
						<div>
							<h2 className="font-heading text-4xl font-bold text-text-primary">
								Available Now
							</h2>
							{!isLoading ? (
								<p className="mt-2 text-lg text-text-secondary">
									{filtersActive
										? `Showing ${String(data.length)} of ${String(allVehicles.length)} vehicles`
										: `${String(allVehicles.length)} vehicle${allVehicles.length !== 1 ? "s" : ""} available`}
								</p>
							) : null}
						</div>
						<SortSelect value={filters.sort} onChange={setSort} />
					</div>

					{isLoading ? (
						<div className={GRID_CLASSES}>
							{Array.from({ length: SKELETON_COUNT }, (_, i) => (
								<VehicleCardSkeleton key={`skeleton-${String(i)}`} />
							))}
						</div>
					) : data.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-24 text-center">
							<SearchX className="mb-4 size-12 text-text-muted" />
							<h2 className="font-heading text-xl font-semibold text-text-primary">
								{filtersActive
									? "No vehicles match your filters"
									: "No vehicles available yet"}
							</h2>
							<p className="mt-2 text-sm text-text-secondary">
								{filtersActive
									? "Try adjusting your search or filters."
									: "Check back soon for new auctions."}
							</p>
							{filtersActive ? (
								<button
									type="button"
									onClick={clearFilters}
									className="bg-accent-gradient mt-6 inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
								>
									Clear all filters
								</button>
							) : null}
						</div>
					) : (
						<div className={GRID_CLASSES}>
							{data.map((vehicle, index) => (
								<VehicleCard
									key={vehicle.id}
									vehicle={vehicle}
									index={index}
									now={now}
								/>
							))}
						</div>
					)}
				</div>
			</main>
		</>
	);
}
