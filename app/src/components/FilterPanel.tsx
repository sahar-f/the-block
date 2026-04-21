import FocusTrap from "focus-trap-react";
import {
	Car,
	DollarSign,
	Fuel,
	MapPin,
	Settings2,
	SlidersHorizontal,
	Star,
	X,
	Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { parseRangeNumber } from "../lib/filters";
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

type FilterGroup = {
	key: FilterKey;
	label: string;
	options: string[];
	icon?: React.ReactNode;
};

const FILTER_GROUPS: FilterGroup[] = [
	{
		key: "auctionStatus",
		label: "Status",
		options: ["live", "upcoming", "ended"],
		icon: <Zap className="size-5 text-accent" />,
	},
	{
		key: "bodyStyle",
		label: "Body Style",
		options: ["SUV", "coupe", "hatchback", "sedan", "truck"],
		icon: <Car className="size-5 text-accent" />,
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
		icon: <MapPin className="size-5 text-accent" />,
	},
	{
		key: "fuelType",
		label: "Fuel Type",
		options: ["diesel", "electric", "gasoline", "hybrid"],
		icon: <Fuel className="size-5 text-accent" />,
	},
	{
		key: "drivetrain",
		label: "Drivetrain",
		options: ["4WD", "AWD", "FWD", "RWD"],
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

function formatOption(key: FilterKey, value: string): string {
	if (key === "auctionStatus" || key === "titleStatus") {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
	return value;
}

export function FilterPanel({
	filters,
	onFilterChange,
	onRangeChange,
	onClear,
}: FilterPanelProps) {
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const activeCount = countActiveFilters(filters);

	useEffect(() => {
		if (!isOpen) return;
		// Body scroll lock + Esc-to-close. Modality is conveyed by role="dialog"
		// + aria-modal, and keyboard focus is trapped by focus-trap-react.
		// (The drawer is portaled to document.body so it escapes any ancestor
		// stacking context created by parent motion/transform.)
		const root = document.documentElement;
		const prevOverflow = root.style.overflow;
		root.style.overflow = "hidden";
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setIsOpen(false);
		}
		document.addEventListener("keydown", onKeyDown);
		return () => {
			root.style.overflow = prevOverflow;
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [isOpen]);

	return (
		<>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => {
					setIsOpen(true);
				}}
				aria-expanded={isOpen}
				className="bg-accent-gradient inline-flex min-h-11 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
			>
				<SlidersHorizontal aria-hidden="true" className="size-4" />
				Filters
				{activeCount > 0 ? (
					<span className="inline-flex min-w-6 items-center justify-center rounded-full bg-white/25 px-2 py-0.5 text-xs font-semibold text-white">
						{activeCount}
					</span>
				) : null}
			</button>

			{createPortal(
				<AnimatePresence>
					{isOpen ? (
						<>
							<motion.div
								key="backdrop"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => {
									setIsOpen(false);
								}}
								className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
							/>
							<FocusTrap
								focusTrapOptions={{
									// We own open/close state — Esc and outside-click close the
									// drawer via our own handlers (see the useEffect above and
									// the backdrop's onClick). focus-trap manages Tab-loop and
									// focus restoration on unmount only.
									escapeDeactivates: false,
									clickOutsideDeactivates: false,
									initialFocus: "[data-drawer-close]",
									// displayCheck: 'none' skips tabbable-visibility checks so
									// motion's transform-translated aside and jsdom are both OK.
									tabbableOptions: { displayCheck: "none" },
								}}
							>
								<motion.aside
									key="drawer"
									role="dialog"
									aria-modal="true"
									aria-labelledby="filter-title"
									initial={{ x: "100%" }}
									animate={{ x: 0 }}
									exit={{ x: "100%" }}
									transition={{ type: "spring", damping: 25, stiffness: 200 }}
									className="fixed right-0 top-0 z-50 flex h-full w-full flex-col overflow-y-auto scroll-pt-24 bg-surface shadow-2xl md:w-[480px]"
								>
									<header className="sticky top-0 z-10 flex items-center justify-between bg-accent-gradient p-6 text-white">
										<div className="flex items-center gap-3">
											<Settings2 className="size-6" aria-hidden="true" />
											<h2 id="filter-title" className="text-2xl font-bold">
												Filters
											</h2>
										</div>
										<motion.button
											data-drawer-close
											type="button"
											whileHover={{ rotate: 90 }}
											whileTap={{ scale: 0.9 }}
											onClick={() => {
												setIsOpen(false);
											}}
											aria-label="Close filters"
											className="rounded-full p-2 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
										>
											<X className="size-6" />
										</motion.button>
									</header>

									<div className="flex-1 space-y-8 p-6">
										<Section
											icon={<DollarSign className="size-5 text-accent" />}
											title="Price Range"
										>
											<div className="flex items-center gap-3">
												<input
													type="number"
													placeholder="Min"
													aria-label="Minimum price"
													value={filters.priceMin ?? ""}
													onChange={(e) => {
														onRangeChange(
															"priceMin",
															parseRangeNumber(e.target.value),
														);
													}}
													min={0}
													className="w-full min-h-11 rounded-xl border border-border bg-surface-subtle px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
												/>
												<span className="text-text-muted">–</span>
												<input
													type="number"
													placeholder="Max"
													aria-label="Maximum price"
													value={filters.priceMax ?? ""}
													onChange={(e) => {
														onRangeChange(
															"priceMax",
															parseRangeNumber(e.target.value),
														);
													}}
													min={0}
													className="w-full min-h-11 rounded-xl border border-border bg-surface-subtle px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
												/>
											</div>
										</Section>

										<Section
											icon={<Star className="size-5 text-accent" />}
											title="Condition"
										>
											<div className="flex items-center gap-3">
												<input
													type="number"
													placeholder="Min"
													aria-label="Minimum condition"
													value={filters.conditionMin ?? ""}
													onChange={(e) => {
														onRangeChange(
															"conditionMin",
															parseRangeNumber(e.target.value, 5),
														);
													}}
													min={0}
													max={5}
													step={0.1}
													className="w-full min-h-11 rounded-xl border border-border bg-surface-subtle px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
												/>
												<span className="text-text-muted">–</span>
												<input
													type="number"
													placeholder="Max"
													aria-label="Maximum condition"
													value={filters.conditionMax ?? ""}
													onChange={(e) => {
														onRangeChange(
															"conditionMax",
															parseRangeNumber(e.target.value, 5),
														);
													}}
													min={0}
													max={5}
													step={0.1}
													className="w-full min-h-11 rounded-xl border border-border bg-surface-subtle px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
												/>
											</div>
										</Section>

										{FILTER_GROUPS.map((group) => {
											const active = filters[group.key] as string[];
											return (
												<Section
													key={group.key}
													icon={group.icon}
													title={group.label}
												>
													<div className="flex flex-wrap gap-2">
														{group.options.map((option) => {
															const isActive = active.includes(option);
															return (
																<button
																	key={option}
																	type="button"
																	onClick={() => {
																		onFilterChange(group.key, option);
																	}}
																	aria-pressed={isActive}
																	className={cn(
																		"min-h-11 rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
																		isActive
																			? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
																			: "border-border bg-surface-subtle text-text-secondary hover:border-accent/30 hover:text-text-primary",
																	)}
																>
																	{formatOption(group.key, option)}
																</button>
															);
														})}
													</div>
												</Section>
											);
										})}
									</div>

									<footer className="sticky bottom-0 space-y-3 border-t border-border bg-surface p-6">
										{activeCount > 0 ? (
											<button
												type="button"
												onClick={onClear}
												className="w-full py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
											>
												Clear all filters
											</button>
										) : null}
										<button
											type="button"
											onClick={() => {
												setIsOpen(false);
											}}
											className="bg-accent-gradient w-full rounded-xl py-3.5 font-semibold text-white shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
										>
											Close
										</button>
									</footer>
								</motion.aside>
							</FocusTrap>
						</>
					) : null}
				</AnimatePresence>,
				document.body,
			)}
		</>
	);
}

function Section({
	icon,
	title,
	children,
}: {
	icon?: React.ReactNode;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-3 border-t border-border pt-6 first:border-t-0 first:pt-0">
			<div className="flex items-center gap-2">
				{icon}
				<h3 className="font-heading text-base font-semibold text-text-primary">
					{title}
				</h3>
			</div>
			{children}
		</div>
	);
}
