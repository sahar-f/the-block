import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { parseFilters, serializeFilters } from "../lib/filters";
import type { FilterState, SortOption } from "../types";

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

export function useFilters() {
	const [searchParams, setSearchParams] = useSearchParams();

	const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

	const setQuery = useCallback(
		(query: string) => {
			const next = { ...filters, query };
			setSearchParams(serializeFilters(next), { replace: true });
		},
		[filters, setSearchParams],
	);

	const setFilter = useCallback(
		(key: FilterKey, value: string) => {
			const current = filters[key] as string[];
			const next = current.includes(value)
				? current.filter((v) => v !== value)
				: [...current, value];
			setSearchParams(
				serializeFilters({ ...filters, [key]: next } as FilterState),
				{ replace: true },
			);
		},
		[filters, setSearchParams],
	);

	const setSort = useCallback(
		(sort: SortOption) => {
			setSearchParams(serializeFilters({ ...filters, sort }), {
				replace: true,
			});
		},
		[filters, setSearchParams],
	);

	const setRange = useCallback(
		(
			key: "priceMin" | "priceMax" | "conditionMin" | "conditionMax",
			value: number | null,
		) => {
			setSearchParams(serializeFilters({ ...filters, [key]: value }), {
				replace: true,
			});
		},
		[filters, setSearchParams],
	);

	const clearFilters = useCallback(() => {
		setSearchParams(new URLSearchParams(), { replace: true });
	}, [setSearchParams]);

	return { filters, setQuery, setFilter, setSort, setRange, clearFilters };
}
