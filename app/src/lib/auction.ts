import type { AuctionState, Vehicle } from "../types";
import { AUCTION_DURATION_MS, MIN_BID_INCREMENT } from "./constants";

export function getMinimumBid(vehicle: Vehicle): number {
	if (vehicle.current_bid === null) return vehicle.starting_bid;
	return vehicle.current_bid + MIN_BID_INCREMENT;
}

export function parseAuctionStart(iso: string): number {
	return new Date(iso).getTime();
}

export function getAuctionStatus(
	auctionStart: number,
	now: number,
): AuctionState {
	if (auctionStart > now) {
		return { status: "upcoming", timeRemaining: auctionStart - now };
	}

	const end = auctionStart + AUCTION_DURATION_MS;

	if (end > now) {
		return { status: "live", timeRemaining: end - now };
	}

	return { status: "ended", timeRemaining: 0 };
}

export function computeNormalizeOffset(vehicles: Vehicle[]): number {
	if (vehicles.length === 0) return 0;

	const timestamps = vehicles
		.map((v) => parseAuctionStart(v.auction_start))
		.sort((a, b) => a - b);

	const medianIndex = Math.floor((timestamps.length - 1) / 2);
	return Date.now() - timestamps[medianIndex];
}

export function applyOffset(vehicle: Vehicle, offset: number): Vehicle {
	return {
		...vehicle,
		auction_start: new Date(
			parseAuctionStart(vehicle.auction_start) + offset,
		).toISOString(),
	};
}

export function normalizeAuctionTimes(vehicles: Vehicle[]): Vehicle[] {
	if (vehicles.length === 0) return [];

	const offset = computeNormalizeOffset(vehicles);
	return vehicles.map((v) => applyOffset(v, offset));
}
