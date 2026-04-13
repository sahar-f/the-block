import { describe, expect, it } from "vitest";
import type { FilterState, Vehicle } from "../types";
import { applyFilters, parseFilters, serializeFilters } from "./filters";

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
	return {
		id: "1",
		vin: "ABC123",
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
		current_bid: null,
		bid_count: 0,
		...overrides,
	};
}

const defaultFilters: FilterState = {
	query: "",
	bodyStyle: [],
	province: [],
	drivetrain: [],
	fuelType: [],
	transmission: [],
	titleStatus: [],
	auctionStatus: [],
	priceMin: null,
	priceMax: null,
	conditionMin: null,
	conditionMax: null,
	sort: "ending_soon",
};

describe("parseFilters", () => {
	it("returns defaults for empty params", () => {
		const result = parseFilters(new URLSearchParams());
		expect(result).toEqual(defaultFilters);
	});

	it("parses query", () => {
		const result = parseFilters(new URLSearchParams("query=Ford"));
		expect(result.query).toBe("Ford");
	});

	it("parses comma-separated arrays", () => {
		const result = parseFilters(new URLSearchParams("bodyStyle=SUV,sedan"));
		expect(result.bodyStyle).toEqual(["SUV", "sedan"]);
	});

	it("parses sort option", () => {
		const result = parseFilters(new URLSearchParams("sort=price_asc"));
		expect(result.sort).toBe("price_asc");
	});

	it("falls back to default for invalid sort", () => {
		const result = parseFilters(new URLSearchParams("sort=invalid"));
		expect(result.sort).toBe("ending_soon");
	});

	it("ignores unknown params", () => {
		const result = parseFilters(new URLSearchParams("foo=bar"));
		expect(result).toEqual(defaultFilters);
	});

	it("ignores negative priceMin", () => {
		const result = parseFilters(new URLSearchParams("priceMin=-100"));
		expect(result.priceMin).toBeNull();
	});

	it("rejects conditionMin above 5", () => {
		const result = parseFilters(new URLSearchParams("conditionMin=99"));
		expect(result.conditionMin).toBeNull();
	});

	it("accepts conditionMax at 5", () => {
		const result = parseFilters(new URLSearchParams("conditionMax=5"));
		expect(result.conditionMax).toBe(5);
	});

	it("rejects conditionMax above 5", () => {
		const result = parseFilters(new URLSearchParams("conditionMax=6"));
		expect(result.conditionMax).toBeNull();
	});

	it("truncates query to 200 characters", () => {
		const longQuery = "a".repeat(300);
		const result = parseFilters(new URLSearchParams(`query=${longQuery}`));
		expect(result.query).toHaveLength(200);
	});
});

describe("serializeFilters", () => {
	it("produces empty params for defaults", () => {
		const result = serializeFilters(defaultFilters);
		expect(result.toString()).toBe("");
	});

	it("serializes query", () => {
		const result = serializeFilters({ ...defaultFilters, query: "Ford" });
		expect(result.get("query")).toBe("Ford");
	});

	it("serializes arrays with commas", () => {
		const result = serializeFilters({
			...defaultFilters,
			bodyStyle: ["SUV", "sedan"],
		});
		expect(result.get("bodyStyle")).toBe("SUV,sedan");
	});

	it("omits default sort", () => {
		const result = serializeFilters(defaultFilters);
		expect(result.has("sort")).toBe(false);
	});

	it("includes non-default sort", () => {
		const result = serializeFilters({
			...defaultFilters,
			sort: "price_asc",
		});
		expect(result.get("sort")).toBe("price_asc");
	});
});

describe("applyFilters", () => {
	const now = Date.now();

	it("filters by text search matching make", () => {
		const vehicles = [
			makeVehicle({ make: "Ford" }),
			makeVehicle({ id: "2", make: "Toyota" }),
		];
		const result = applyFilters(
			vehicles,
			{ ...defaultFilters, query: "Ford" },
			now,
		);
		expect(result).toHaveLength(1);
		expect(result[0].make).toBe("Ford");
	});

	it("filters by text search matching VIN", () => {
		const vehicles = [
			makeVehicle({ vin: "XYZ789" }),
			makeVehicle({ id: "2", vin: "ABC123" }),
		];
		const result = applyFilters(
			vehicles,
			{ ...defaultFilters, query: "xyz" },
			now,
		);
		expect(result).toHaveLength(1);
		expect(result[0].vin).toBe("XYZ789");
	});

	it("filters by body_style", () => {
		const vehicles = [
			makeVehicle({ body_style: "SUV" }),
			makeVehicle({ id: "2", body_style: "sedan" }),
		];
		const result = applyFilters(
			vehicles,
			{ ...defaultFilters, bodyStyle: ["SUV"] },
			now,
		);
		expect(result).toHaveLength(1);
		expect(result[0].body_style).toBe("SUV");
	});

	it("sorts by price ascending", () => {
		const vehicles = [
			makeVehicle({ id: "1", starting_bid: 30000 }),
			makeVehicle({ id: "2", starting_bid: 10000 }),
			makeVehicle({ id: "3", starting_bid: 20000 }),
		];
		const result = applyFilters(
			vehicles,
			{ ...defaultFilters, sort: "price_asc" },
			now,
		);
		expect(result.map((v) => v.starting_bid)).toEqual([10000, 20000, 30000]);
	});

	it("uses current_bid for price sort when available", () => {
		const vehicles = [
			makeVehicle({ id: "1", starting_bid: 30000, current_bid: 5000 }),
			makeVehicle({ id: "2", starting_bid: 10000, current_bid: null }),
		];
		const result = applyFilters(
			vehicles,
			{ ...defaultFilters, sort: "price_asc" },
			now,
		);
		expect(result[0].id).toBe("1");
	});

	it("filters by price range", () => {
		const vehicles = [
			makeVehicle({ id: "1", starting_bid: 5000 }),
			makeVehicle({ id: "2", starting_bid: 15000 }),
			makeVehicle({ id: "3", starting_bid: 25000 }),
		];
		const result = applyFilters(
			vehicles,
			{ ...defaultFilters, priceMin: 10000, priceMax: 20000 },
			now,
		);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("2");
	});

	it("does not mutate input", () => {
		const vehicles = [makeVehicle()];
		const copy = [...vehicles];
		applyFilters(vehicles, defaultFilters, now);
		expect(vehicles).toEqual(copy);
	});
});
