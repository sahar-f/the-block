import { useMemo, useSyncExternalStore } from "react";
import * as dataStore from "../lib/dataStore";
import { applyFilters } from "../lib/filters";
import type { FilterState, Vehicle } from "../types";

type UseVehiclesResult = {
	data: Vehicle[];
	allVehicles: Vehicle[];
	isLoading: boolean;
	error: string | null;
};

export function useVehicles(
	filters: FilterState,
	now: number,
): UseVehiclesResult {
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

	return { data, allVehicles, isLoading, error };
}
