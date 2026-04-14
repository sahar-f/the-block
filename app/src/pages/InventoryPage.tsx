import { AlertCircle, SearchX } from "lucide-react";
import { useEffect } from "react";
import { EndingSoonStrip } from "../components/EndingSoonStrip";
import { FilterPanel } from "../components/FilterPanel";
import { SearchBar } from "../components/SearchBar";
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
	"mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 2xl:grid-cols-5";

export function InventoryPage() {
	const { filters, setQuery, setFilter, setSort, setRange, clearFilters } =
		useFilters();
	const now = useNow();
	const { data, allVehicles, isLoading, error } = useVehicles(filters, now);
	const filtersActive = hasActiveFilters(filters);

	useEffect(() => {
		document.title = "The Block | Inventory";
	}, []);

	if (error) {
		return (
			<div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
				<AlertCircle className="mb-4 size-12 text-error" />
				<h2 className="font-heading text-xl font-semibold text-text-primary">
					Something went wrong
				</h2>
				<p className="mt-2 text-sm text-text-secondary">{error}</p>
			</div>
		);
	}

	return (
		<div className="bg-page-atmosphere">
			<div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10 xl:px-12">
				<header className="mb-6">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-full bg-accent">
							<div className="size-4 rounded-full border-[2.5px] border-page" />
						</div>
						<div>
							<h1 className="font-heading text-3xl font-semibold tracking-tight text-text-primary">
								The Block
							</h1>
							<p className="text-xs tracking-widest uppercase text-text-muted">
								Vehicle Auctions
							</p>
						</div>
					</div>
				</header>

				<div className="space-y-6">
					<StatsBar vehicles={allVehicles} now={now} />
					<EndingSoonStrip vehicles={allVehicles} now={now} />

					<div className="flex flex-col gap-4 sm:flex-row">
						<SearchBar value={filters.query} onChange={setQuery} />
						<SortSelect value={filters.sort} onChange={setSort} />
					</div>
					<FilterPanel
						filters={filters}
						onFilterChange={setFilter}
						onRangeChange={setRange}
						onClear={clearFilters}
					/>
				</div>

				<div className="mt-6 border-t border-border/50" />

				{!isLoading ? (
					<p className="mt-4 text-sm text-text-secondary">
						{filtersActive
							? `Showing ${String(data.length)} of ${String(allVehicles.length)} vehicles`
							: `${String(allVehicles.length)} vehicle${allVehicles.length !== 1 ? "s" : ""} available`}
					</p>
				) : null}

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
								className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-page transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
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
		</div>
	);
}
