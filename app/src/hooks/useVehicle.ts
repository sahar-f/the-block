import { useMemo, useSyncExternalStore } from "react";
import * as dataStore from "../lib/dataStore";
import type { Vehicle } from "../types";

export function useVehicle(id: string): {
	data: Vehicle | null;
	isLoading: boolean;
	error: string | null;
} {
	// getIsInitialized/getInitError are read outside useSyncExternalStore, but
	// this is safe: ensureInit always calls notifySubscribers() when these change,
	// and the vehicles array reference also changes at the same time ([] → loaded).
	// useSyncExternalStore detects the vehicles reference change and triggers re-render.
	const allVehicles = useSyncExternalStore(
		dataStore.subscribe,
		dataStore.getVehicles,
	);

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
