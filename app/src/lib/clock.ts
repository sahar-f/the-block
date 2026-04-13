import { CLOCK_INTERVAL_MS } from "./constants";

let now = Date.now();
let intervalId: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<() => void>();

function tick() {
	now = Date.now();
	for (const cb of subscribers) {
		cb();
	}
}

export function subscribe(callback: () => void): () => void {
	subscribers.add(callback);

	if (subscribers.size === 1) {
		intervalId = setInterval(tick, CLOCK_INTERVAL_MS);
	}

	return () => {
		subscribers.delete(callback);
		if (subscribers.size === 0 && intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	};
}

export function getSnapshot(): number {
	return now;
}
