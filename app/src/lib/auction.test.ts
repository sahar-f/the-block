import { describe, expect, it } from "vitest";
import type { Vehicle } from "../types";
import {
	getAuctionStatus,
	normalizeAuctionTimes,
	parseAuctionStart,
} from "./auction";
import { AUCTION_DURATION_MS } from "./constants";

describe("parseAuctionStart", () => {
	it("converts ISO string to timestamp", () => {
		const iso = "2026-04-05T19:00:00Z";
		const result = parseAuctionStart(iso);
		expect(result).toBe(new Date(iso).getTime());
	});

	it("handles timezone offset", () => {
		const utc = parseAuctionStart("2026-04-05T19:00:00Z");
		const eastern = parseAuctionStart("2026-04-05T15:00:00-04:00");
		expect(utc).toBe(eastern);
	});
});

describe("getAuctionStatus", () => {
	const now = 1_000_000_000;

	it("returns upcoming when start is in the future", () => {
		const start = now + 60_000;
		const result = getAuctionStatus(start, now);
		expect(result).toEqual({ status: "upcoming", timeRemaining: 60_000 });
	});

	it("returns live when start is in the past within 4 hours", () => {
		const start = now - 60_000;
		const result = getAuctionStatus(start, now);
		expect(result).toEqual({
			status: "live",
			timeRemaining: AUCTION_DURATION_MS - 60_000,
		});
	});

	it("returns live at exact start time", () => {
		const result = getAuctionStatus(now, now);
		expect(result).toEqual({
			status: "live",
			timeRemaining: AUCTION_DURATION_MS,
		});
	});

	it("returns ended when past 4 hours", () => {
		const start = now - AUCTION_DURATION_MS - 1;
		const result = getAuctionStatus(start, now);
		expect(result).toEqual({ status: "ended", timeRemaining: 0 });
	});

	it("returns ended at exact boundary (start + 4hrs = now)", () => {
		const start = now - AUCTION_DURATION_MS;
		const result = getAuctionStatus(start, now);
		expect(result).toEqual({ status: "ended", timeRemaining: 0 });
	});

	it("returns live 1ms before boundary", () => {
		const start = now - AUCTION_DURATION_MS + 1;
		const result = getAuctionStatus(start, now);
		expect(result).toEqual({ status: "live", timeRemaining: 1 });
	});
});

describe("normalizeAuctionTimes", () => {
	it("returns empty array for empty input", () => {
		expect(normalizeAuctionTimes([])).toEqual([]);
	});

	it("produces a mix of statuses for 200 vehicles", () => {
		const now = Date.now();
		const vehicles: Vehicle[] = Array.from({ length: 200 }, (_, i) => ({
			id: String(i),
			vin: `VIN${i}`,
			year: 2020,
			make: "Test",
			model: "Car",
			trim: "Base",
			body_style: "sedan",
			exterior_color: "Black",
			interior_color: "Black",
			engine: "2.0L",
			transmission: "automatic",
			drivetrain: "FWD",
			odometer_km: 50000,
			fuel_type: "gasoline",
			condition_grade: 3.5,
			condition_report: "Good",
			damage_notes: [],
			title_status: "clean",
			province: "Ontario",
			city: "Toronto",
			auction_start: new Date(
				now - 12 * 60 * 60 * 1000 + i * 2 * 60 * 60 * 1000,
			).toISOString(),
			starting_bid: 10000,
			reserve_price: null,
			buy_now_price: null,
			images: [],
			selling_dealership: "Test Dealer",
			lot: `A-${String(i).padStart(4, "0")}`,
			current_bid: null,
			bid_count: 0,
		}));

		const normalized = normalizeAuctionTimes(vehicles);
		expect(normalized).toHaveLength(200);

		const statuses = normalized.map((v) =>
			getAuctionStatus(parseAuctionStart(v.auction_start), Date.now()),
		);

		const hasUpcoming = statuses.some((s) => s.status === "upcoming");
		const hasLive = statuses.some((s) => s.status === "live");
		const hasEnded = statuses.some((s) => s.status === "ended");

		expect(hasUpcoming).toBe(true);
		expect(hasLive).toBe(true);
		expect(hasEnded).toBe(true);
	});

	it("does not mutate the input array", () => {
		const original: Vehicle[] = [
			{
				id: "1",
				vin: "VIN1",
				year: 2020,
				make: "Test",
				model: "Car",
				trim: "Base",
				body_style: "sedan",
				exterior_color: "Black",
				interior_color: "Black",
				engine: "2.0L",
				transmission: "automatic",
				drivetrain: "FWD",
				odometer_km: 50000,
				fuel_type: "gasoline",
				condition_grade: 3.5,
				condition_report: "Good",
				damage_notes: [],
				title_status: "clean",
				province: "Ontario",
				city: "Toronto",
				auction_start: "2020-01-01T00:00:00Z",
				starting_bid: 10000,
				reserve_price: null,
				buy_now_price: null,
				images: [],
				selling_dealership: "Test Dealer",
				lot: "A-0001",
				current_bid: null,
				bid_count: 0,
			},
		];
		const originalStart = original[0].auction_start;
		normalizeAuctionTimes(original);
		expect(original[0].auction_start).toBe(originalStart);
	});
});
