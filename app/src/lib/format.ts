import type { Vehicle } from "../types";

const currencyFormatter = new Intl.NumberFormat("en-CA", {
	style: "currency",
	currency: "CAD",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-CA");

export function formatCurrency(amount: number): string {
	return currencyFormatter.format(amount);
}

export function getDisplayPrice(vehicle: Vehicle): number {
	return vehicle.current_bid ?? vehicle.starting_bid;
}

export function formatOdometer(km: number): string {
	return `${numberFormatter.format(km)} km`;
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-CA", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function getPlaceholderUrl(vehicle: Vehicle): string {
	const text = encodeURIComponent(
		`${vehicle.year} ${vehicle.make} ${vehicle.model}`,
	);
	return `https://placehold.co/800x600/141416/71717A?text=${text}`;
}

export function formatTimeRemaining(ms: number): string {
	if (ms <= 0) return "Ended";

	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) return `${String(hours)}h ${String(minutes)}m`;
	return `${String(minutes)}m ${String(seconds)}s`;
}
