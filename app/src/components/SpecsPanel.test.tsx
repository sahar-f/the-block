import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Vehicle } from "../types";
import { SpecsPanel } from "./SpecsPanel";

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
	return {
		id: "v1",
		vin: "VIN123ABCDEF4567",
		year: 2024,
		make: "Toyota",
		model: "Camry",
		trim: "SE",
		body_style: "sedan",
		exterior_color: "Silver Metallic",
		interior_color: "Ebony Black",
		engine: "2.5L I4",
		transmission: "automatic",
		drivetrain: "FWD",
		odometer_km: 47731,
		fuel_type: "gasoline",
		condition_grade: 4.0,
		condition_report: "Good",
		damage_notes: [],
		title_status: "clean",
		province: "Ontario",
		city: "Toronto",
		auction_start: new Date().toISOString(),
		starting_bid: 10000,
		reserve_price: null,
		buy_now_price: null,
		images: [],
		selling_dealership: "Dealer",
		lot: "A-0001",
		current_bid: null,
		bid_count: 0,
		...overrides,
	};
}

describe("SpecsPanel", () => {
	it("renders heading", () => {
		render(<SpecsPanel vehicle={makeVehicle()} />);
		expect(
			screen.getByRole("heading", { level: 2, name: /specifications/i }),
		).toBeInTheDocument();
	});

	it("renders all spec values", () => {
		render(<SpecsPanel vehicle={makeVehicle()} />);
		expect(screen.getByText("2.5L I4")).toBeInTheDocument();
		expect(screen.getByText("automatic")).toBeInTheDocument();
		expect(screen.getByText("FWD")).toBeInTheDocument();
		expect(screen.getByText("gasoline")).toBeInTheDocument();
		expect(screen.getByText("sedan")).toBeInTheDocument();
		expect(screen.getByText("47,731 km")).toBeInTheDocument();
		expect(screen.getByText("Silver Metallic")).toBeInTheDocument();
		expect(screen.getByText("Ebony Black")).toBeInTheDocument();
		expect(screen.getByText("VIN123ABCDEF4567")).toBeInTheDocument();
	});

	it("renders VIN in monospace font", () => {
		render(<SpecsPanel vehicle={makeVehicle()} />);
		const vinEl = screen.getByText("VIN123ABCDEF4567");
		expect(vinEl.className).toContain("font-mono");
	});
});
