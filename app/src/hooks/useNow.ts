import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../lib/clock";

export function useNow(): number {
	return useSyncExternalStore(subscribe, getSnapshot);
}
