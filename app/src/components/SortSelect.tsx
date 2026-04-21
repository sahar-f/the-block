import { ChevronDown } from "lucide-react";
import type { SortOption } from "../types";

type SortSelectProps = {
	value: SortOption;
	onChange: (sort: SortOption) => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "ending_soon", label: "Ending Soon" },
	{ value: "price_asc", label: "Price: Low to High" },
	{ value: "price_desc", label: "Price: High to Low" },
	{ value: "year_desc", label: "Newest First" },
	{ value: "condition_desc", label: "Best Condition" },
	{ value: "most_bids", label: "Most Bids" },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
	return (
		<div className="relative">
			<select
				value={value}
				onChange={(e) => onChange(e.target.value as SortOption)}
				aria-label="Sort vehicles"
				className="appearance-none min-h-11 rounded-xl border border-border bg-surface py-2.5 pl-4 pr-10 font-body text-sm text-text-primary cursor-pointer shadow-sm transition-colors hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-page"
			>
				{SORT_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
		</div>
	);
}
