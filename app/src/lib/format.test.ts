import { describe, expect, it } from "vitest";
import type { Vehicle } from "../types";
import {
	formatCurrency,
	formatDate,
	formatOdometer,
	formatTimeRemaining,
	getPlaceholderUrl,
} from "./format";

describe("formatCurrency", () => {
	it("formats zero", () => {
		expect(formatCurrency(0)).toBe("$0");
	});

	it("formats thousands with comma", () => {
		expect(formatCurrency(1000)).toBe("$1,000");
	});

	it("formats large numbers", () => {
		expect(formatCurrency(99999)).toBe("$99,999");
	});

	it("formats negative numbers", () => {
		expect(formatCurrency(-500)).toBe("-$500");
	});
});

describe("formatOdometer", () => {
	it("formats zero", () => {
		expect(formatOdometer(0)).toBe("0 km");
	});

	it("formats with commas", () => {
		expect(formatOdometer(47731)).toBe("47,731 km");
	});

	it("formats large values", () => {
		expect(formatOdometer(200000)).toBe("200,000 km");
	});
});

describe("formatDate", () => {
	it("formats ISO date string", () => {
		const result = formatDate("2026-04-05T19:00:00");
		expect(result).toMatch(/Apr/);
		expect(result).toMatch(/2026/);
	});
});

describe("isSafeImageUrl", () => {
	it("accepts http(s) URLs", async () => {
		const { isSafeImageUrl } = await import("./format");
		expect(isSafeImageUrl("https://example.com/a.jpg")).toBe(true);
		expect(isSafeImageUrl("http://example.com/a.jpg")).toBe(true);
	});

	it("rejects non-http(s) protocols and malformed input", async () => {
		const { isSafeImageUrl } = await import("./format");
		expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
		expect(isSafeImageUrl("data:image/svg+xml,<svg/>")).toBe(false);
		expect(isSafeImageUrl("file:///etc/passwd")).toBe(false);
		expect(isSafeImageUrl("not a url")).toBe(false);
		expect(isSafeImageUrl("")).toBe(false);
		expect(isSafeImageUrl(undefined)).toBe(false);
	});
});

describe("getVehicleImageUrl", () => {
	it("returns the indexed image when it is a safe URL", async () => {
		const { getVehicleImageUrl } = await import("./format");
		const v = {
			year: 2024,
			make: "X",
			model: "Y",
			images: ["https://a.com/1.jpg", "https://a.com/2.jpg"],
		} as Vehicle;
		expect(getVehicleImageUrl(v, 0)).toBe("https://a.com/1.jpg");
		expect(getVehicleImageUrl(v, 1)).toBe("https://a.com/2.jpg");
	});

	it("falls back to placeholder for missing or unsafe URLs", async () => {
		const { getVehicleImageUrl } = await import("./format");
		const v = {
			year: 2024,
			make: "X",
			model: "Y",
			images: ["javascript:alert(1)", ""],
		} as Vehicle;
		expect(getVehicleImageUrl(v, 0)).toContain("placehold.co");
		expect(getVehicleImageUrl(v, 1)).toContain("placehold.co");
		expect(getVehicleImageUrl(v, 99)).toContain("placehold.co");
	});
});

describe("getPlaceholderUrl", () => {
	it("generates themed URL with vehicle info", () => {
		const vehicle = { year: 2023, make: "Ford", model: "Bronco" } as Vehicle;
		const url = getPlaceholderUrl(vehicle);
		expect(url).toBe(
			"https://placehold.co/800x600/141416/71717A?text=2023%20Ford%20Bronco",
		);
	});

	it("encodes special characters", () => {
		const vehicle = {
			year: 2024,
			make: "Mercedes-Benz",
			model: "C-Class",
		} as Vehicle;
		const url = getPlaceholderUrl(vehicle);
		expect(url).toContain("2024%20Mercedes-Benz%20C-Class");
		expect(
			url.startsWith("https://placehold.co/800x600/141416/71717A?text="),
		).toBe(true);
	});
});

describe("formatTimeRemaining", () => {
	it("formats hours and minutes", () => {
		const twoHours34Min = 2 * 3_600_000 + 34 * 60_000;
		expect(formatTimeRemaining(twoHours34Min)).toBe("2h 34m");
	});

	it("formats minutes and seconds when under 1 hour", () => {
		const fiftyFourMin12Sec = 54 * 60_000 + 12_000;
		expect(formatTimeRemaining(fiftyFourMin12Sec)).toBe("54m 12s");
	});

	it("returns Ended for zero", () => {
		expect(formatTimeRemaining(0)).toBe("Ended");
	});

	it("returns Ended for negative", () => {
		expect(formatTimeRemaining(-1000)).toBe("Ended");
	});

	it("handles exactly 1 hour", () => {
		expect(formatTimeRemaining(3_600_000)).toBe("1h 0m");
	});

	it("handles under 1 minute", () => {
		expect(formatTimeRemaining(45_000)).toBe("0m 45s");
	});
});
