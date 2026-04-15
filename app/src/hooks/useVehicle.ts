import { useMemo, useSyncExternalStore } from "react";
import * as dataStore from "../lib/dataStore";
import type { Vehicle } from "../types";

export function useVehicle(id: string): {
	data: Vehicle | null;
	isLoading: boolean;
	error: string | null;
} {
	const allVehicles = useSyncExternalStore(
		dataStore.subscribe,
		dataStore.getVehicles,
	);

	// Safe to read outside the store: ensureInit() always notifies subscribers
	// when these flip, alongside a vehicles array reference change.
	const isLoading = !dataStore.getIsInitialized();
	const error = dataStore.getInitError();
	const data = useMemo(
		() => allVehicles.find((v) => v.id === id) ?? null,
		[allVehicles, id],
	);

	if (isLoading) {
		return { data: null, isLoading: true, error: null };
	}

	return { data, isLoading: false, error };
}
