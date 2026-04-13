import { useMemo, useSyncExternalStore } from "react";
import * as dataStore from "../lib/dataStore";
import { applyFilters } from "../lib/filters";
import type { FilterState, Vehicle } from "../types";
import { useNow } from "./useNow";

export function useVehicles(filters: FilterState): {
	data: Vehicle[];
	isLoading: boolean;
	error: string | null;
} {
	const now = useNow();
	// Safe to read outside useSyncExternalStore — see useVehicle.ts comment
	const allVehicles = useSyncExternalStore(
		dataStore.subscribe,
		dataStore.getVehicles,
	);

	const isLoading = !dataStore.getIsInitialized();
	const error = dataStore.getInitError();

	const data = useMemo(
		() => applyFilters(allVehicles, filters, now),
		[allVehicles, filters, now],
	);

	return { data, isLoading, error };
}
