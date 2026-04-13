import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as dataStore from "../lib/dataStore";
import type { Vehicle } from "../types";
import { useBid } from "./useBid";

vi.mock("../lib/dataStore", () => ({
	submitBid: vi.fn().mockResolvedValue({
		success: true,
		bid: {
			id: "bid-1",
			vehicle_id: "v1",
			amount: 10100,
			bidder_session: "session-1",
			created_at: "2026-01-01T00:00:00Z",
		},
	}),
	getVehicle: vi.fn(),
}));

const mockGetVehicle = vi.mocked(dataStore.getVehicle);
const mockSubmitBid = vi.mocked(dataStore.submitBid);

function makeLiveVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
	return {
		id: "v1",
		vin: "VIN1",
		year: 2022,
		make: "Ford",
		model: "F-150",
		trim: "XLT",
		body_style: "truck",
		exterior_color: "Black",
		interior_color: "Black",
		engine: "3.5L V6",
		transmission: "automatic",
		drivetrain: "4WD",
		odometer_km: 50000,
		fuel_type: "gasoline",
		condition_grade: 4.0,
		condition_report: "Good",
		damage_notes: [],
		title_status: "clean",
		province: "Ontario",
		city: "Toronto",
		auction_start: new Date(Date.now() - 60_000).toISOString(),
		starting_bid: 10000,
		reserve_price: null,
		buy_now_price: null,
		images: [],
		selling_dealership: "Test Dealer",
		lot: "A-0001",
		current_bid: 10000,
		bid_count: 1,
		...overrides,
	};
}

function makeEndedVehicle(): Vehicle {
	return makeLiveVehicle({
		auction_start: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
	});
}

describe("useBid", () => {
	it("accepts a valid bid (current_bid + MIN_BID_INCREMENT)", async () => {
		mockGetVehicle.mockReturnValue(makeLiveVehicle());
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.submit(10100);
		});

		expect(result.current.error).toBeNull();
		expect(result.current.lastBid).toBeTruthy();
	});

	it("rejects a bid below minimum increment", async () => {
		mockGetVehicle.mockReturnValue(makeLiveVehicle());
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.submit(10050);
		});

		expect(result.current.error).toEqual({
			type: "bid_too_low",
			minimum: 10100,
			message: expect.stringContaining("10,100"),
		});
	});

	it("accepts starting_bid when no current_bid exists", async () => {
		mockGetVehicle.mockReturnValue(
			makeLiveVehicle({ current_bid: null, bid_count: 0 }),
		);
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.submit(10000);
		});

		expect(result.current.error).toBeNull();
	});

	it("rejects bid below starting_bid when no current_bid", async () => {
		mockGetVehicle.mockReturnValue(
			makeLiveVehicle({ current_bid: null, bid_count: 0 }),
		);
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.submit(9999);
		});

		expect(result.current.error).toEqual({
			type: "bid_too_low",
			minimum: 10000,
			message: expect.stringContaining("10,000"),
		});
	});

	it("rejects bid when auction has ended", async () => {
		mockGetVehicle.mockReturnValue(makeEndedVehicle());
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.submit(50000);
		});

		expect(result.current.error).toEqual({
			type: "auction_ended",
			message: expect.stringContaining("ended"),
		});
	});

	it("rejects a negative bid amount", async () => {
		mockGetVehicle.mockReturnValue(makeLiveVehicle());
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.submit(-100);
		});

		expect(result.current.error).toEqual({
			type: "bid_too_low",
			minimum: 10100,
			message: expect.stringContaining("10,100"),
		});
	});

	it("rejects a zero bid amount", async () => {
		mockGetVehicle.mockReturnValue(makeLiveVehicle());
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.submit(0);
		});

		expect(result.current.error).toEqual({
			type: "bid_too_low",
			minimum: 10100,
			message: expect.stringContaining("10,100"),
		});
	});

	it("buyNow succeeds when buy_now_price exists and auction is live", async () => {
		mockGetVehicle.mockReturnValue(makeLiveVehicle({ buy_now_price: 50000 }));
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.buyNow();
		});

		expect(result.current.error).toBeNull();
		expect(result.current.lastBid).toBeTruthy();
		expect(mockSubmitBid).toHaveBeenCalledWith("v1", 50000);
	});

	it("buyNow is blocked when auction has ended", async () => {
		mockGetVehicle.mockReturnValue({
			...makeEndedVehicle(),
			buy_now_price: 50000,
		});
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.buyNow();
		});

		expect(result.current.error).toEqual({
			type: "auction_ended",
			message: expect.stringContaining("ended"),
		});
	});

	it("buyNow does nothing when buy_now_price is null", async () => {
		mockGetVehicle.mockReturnValue(makeLiveVehicle({ buy_now_price: null }));
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.buyNow();
		});

		expect(result.current.error).toBeNull();
		expect(result.current.lastBid).toBeNull();
	});

	it("returns network error when vehicle not found", async () => {
		mockGetVehicle.mockReturnValue(null);
		const { result } = renderHook(() => useBid("v1"));

		await act(async () => {
			await result.current.submit(10100);
		});

		expect(result.current.error).toEqual({
			type: "network",
			message: "Vehicle not found.",
		});
	});

	it("clears error on successful subsequent bid", async () => {
		mockGetVehicle.mockReturnValue(makeLiveVehicle());
		const { result } = renderHook(() => useBid("v1"));

		// First: bad bid
		await act(async () => {
			await result.current.submit(50);
		});
		expect(result.current.error).not.toBeNull();

		// Second: good bid
		await act(async () => {
			await result.current.submit(10100);
		});
		expect(result.current.error).toBeNull();
	});
});
