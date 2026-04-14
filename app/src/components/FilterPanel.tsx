import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";
import type { FilterState } from "../types";

type FilterKey = keyof Pick<
	FilterState,
	| "bodyStyle"
	| "province"
	| "drivetrain"
	| "fuelType"
	| "transmission"
	| "titleStatus"
	| "auctionStatus"
>;

type FilterPanelProps = {
	filters: FilterState;
	onFilterChange: (key: FilterKey, value: string) => void;
	onRangeChange: (
		key: "priceMin" | "priceMax" | "conditionMin" | "conditionMax",
		value: number | null,
	) => void;
	onClear: () => void;
};

const FILTER_GROUPS: { key: FilterKey; label: string; options: string[] }[] = [
	{
		key: "auctionStatus",
		label: "Status",
		options: ["live", "upcoming", "ended"],
	},
	{
		key: "bodyStyle",
		label: "Body Style",
		options: ["SUV", "coupe", "hatchback", "sedan", "truck"],
	},
	{
		key: "province",
		label: "Province",
		options: [
			"Alberta",
			"British Columbia",
			"Manitoba",
			"Nova Scotia",
			"Ontario",
			"Quebec",
			"Saskatchewan",
		],
	},
	{
		key: "drivetrain",
		label: "Drivetrain",
		options: ["4WD", "AWD", "FWD", "RWD"],
	},
	{
		key: "fuelType",
		label: "Fuel Type",
		options: ["diesel", "electric", "gasoline", "hybrid"],
	},
	{
		key: "transmission",
		label: "Transmission",
		options: ["CVT", "automatic", "manual", "single-speed"],
	},
	{
		key: "titleStatus",
		label: "Title",
		options: ["clean", "rebuilt", "salvage"],
	},
];

function countActiveFilters(filters: FilterState): number {
	let count = 0;
	for (const group of FILTER_GROUPS) {
		count += (filters[group.key] as string[]).length;
	}
	if (filters.priceMin !== null) count++;
	if (filters.priceMax !== null) count++;
	if (filters.conditionMin !== null) count++;
	if (filters.conditionMax !== null) count++;
	return count;
}

export function FilterPanel({
	filters,
	onFilterChange,
	onRangeChange,
	onClear,
}: FilterPanelProps) {
	const [isOpen, setIsOpen] = useState(false);
	const activeCount = countActiveFilters(filters);

	return (
		<div>
			<button
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
			>
				<SlidersHorizontal className="size-4" />
				Filters
				{activeCount > 0 ? (
					<span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
						{activeCount}
					</span>
				) : null}
			</button>

			<div
				className={cn(
					"grid transition-[grid-template-rows] duration-200 ease-out",
					isOpen ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr]",
				)}
			>
				<div className="overflow-hidden">
					<div className="rounded-lg border border-border/50 bg-surface/50 p-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
						{FILTER_GROUPS.map((group) => {
							const active = filters[group.key] as string[];
							return (
								<div key={group.key}>
									<p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
										{group.label}
									</p>
									<div className="flex flex-wrap gap-1.5">
										{group.options.map((option) => {
											const isActive = active.includes(option);
											return (
												<button
													key={option}
													type="button"
													onClick={() => onFilterChange(group.key, option)}
													className={cn(
														"rounded-md border px-2.5 py-1 text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-page",
														isActive
															? "border-accent/30 bg-accent/10 text-accent"
															: "border-border text-text-secondary hover:border-border-hover hover:text-text-primary",
													)}
												>
													{group.key === "auctionStatus"
														? option.charAt(0).toUpperCase() + option.slice(1)
														: option}
												</button>
											);
										})}
									</div>
								</div>
							);
						})}

						<div>
							<p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
								Price Range
							</p>
							<div className="flex items-center gap-2">
								<input
									type="number"
									placeholder="Min"
									aria-label="Minimum price"
									value={filters.priceMin ?? ""}
									onChange={(e) =>
										onRangeChange(
											"priceMin",
											e.target.value ? Number(e.target.value) : null,
										)
									}
									min={0}
									className="w-full rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-page"
								/>
								<span className="text-text-muted">–</span>
								<input
									type="number"
									placeholder="Max"
									aria-label="Maximum price"
									value={filters.priceMax ?? ""}
									onChange={(e) =>
										onRangeChange(
											"priceMax",
											e.target.value ? Number(e.target.value) : null,
										)
									}
									min={0}
									className="w-full rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-page"
								/>
							</div>
						</div>

						<div>
							<p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
								Condition
							</p>
							<div className="flex items-center gap-2">
								<input
									type="number"
									placeholder="Min"
									aria-label="Minimum condition"
									value={filters.conditionMin ?? ""}
									onChange={(e) =>
										onRangeChange(
											"conditionMin",
											e.target.value ? Number(e.target.value) : null,
										)
									}
									min={0}
									max={5}
									step={0.1}
									className="w-full rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-page"
								/>
								<span className="text-text-muted">–</span>
								<input
									type="number"
									placeholder="Max"
									aria-label="Maximum condition"
									value={filters.conditionMax ?? ""}
									onChange={(e) =>
										onRangeChange(
											"conditionMax",
											e.target.value ? Number(e.target.value) : null,
										)
									}
									min={0}
									max={5}
									step={0.1}
									className="w-full rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-page"
								/>
							</div>
						</div>
					</div>

					{activeCount > 0 ? (
						<button
							type="button"
							onClick={onClear}
							className="mt-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-page"
						>
							<X className="size-3.5" />
							Clear all filters
						</button>
					) : null}
				</div>
			</div>
		</div>
	);
}
