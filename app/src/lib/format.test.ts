import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatOdometer } from "./format";

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
