import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "../types";
import { EndingSoonStrip } from "./EndingSoonStrip";

vi.mock("../lib/auction", () => ({
	parseAuctionStart: (iso: string) => new Date(iso).getTime(),
	getAuctionStatus: vi.fn((auctionStart: number, now: number) => {
		const diff = now - auctionStart;
		if (diff < 0) return { status: "upcoming" as const, timeRemaining: -diff };
		if (diff < 4 * 3_600_000)
			return { status: "live" as const, timeRemaining: 4 * 3_600_000 - diff };
		return { status: "ended" as const, timeRemaining: 0 };
	}),
}));

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
	return {
		id: "v1",
		vin: "V1",
		year: 2024,
		make: "Toyota",
		model: "Camry",
		trim: "SE",
		body_style: "sedan",
		exterior_color: "White",
		interior_color: "Black",
		engine: "2.5L",
		transmission: "automatic",
		drivetrain: "FWD",
		odometer_km: 10000,
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
		current_bid: 15000,
		bid_count: 3,
		...overrides,
	};
}

describe("EndingSoonStrip", () => {
	it("returns null when no live vehicles", () => {
		const now = Date.now();
		const vehicles = [
			makeVehicle({
				auction_start: new Date(now - 5 * 3_600_000).toISOString(),
			}),
		];
		const { container } = render(
			<MemoryRouter>
				<EndingSoonStrip vehicles={vehicles} now={now} />
			</MemoryRouter>,
		);
		expect(container.innerHTML).toBe("");
	});

	it("returns null for empty list", () => {
		const { container } = render(
			<MemoryRouter>
				<EndingSoonStrip vehicles={[]} now={Date.now()} />
			</MemoryRouter>,
		);
		expect(container.innerHTML).toBe("");
	});

	it("renders section label with Clock icon", () => {
		const now = Date.now();
		const vehicles = [
			makeVehicle({ auction_start: new Date(now - 1000).toISOString() }),
		];
		render(
			<MemoryRouter>
				<EndingSoonStrip vehicles={vehicles} now={now} />
			</MemoryRouter>,
		);
		expect(screen.getByText("Ending Soon")).toBeInTheDocument();
	});

	it("caps results at 5 vehicles", () => {
		const now = Date.now();
		const vehicles = Array.from({ length: 7 }, (_, i) =>
			makeVehicle({
				id: `v${String(i)}`,
				make: `Make${String(i)}`,
				auction_start: new Date(now - (i + 1) * 60_000).toISOString(),
			}),
		);
		render(
			<MemoryRouter>
				<EndingSoonStrip vehicles={vehicles} now={now} />
			</MemoryRouter>,
		);
		const links = screen.getAllByRole("link");
		expect(links.length).toBe(5);
	});

	it("sorts by time remaining ascending (closest-to-ending first)", () => {
		const now = Date.now();
		// Vehicle A started 3.9h ago → ~6min remaining (closest to ending)
		// Vehicle B started 2h ago → ~2h remaining
		// Vehicle C started 30min ago → ~3.5h remaining (furthest)
		const vehicles = [
			makeVehicle({
				id: "c",
				make: "C",
				auction_start: new Date(now - 30 * 60_000).toISOString(),
			}),
			makeVehicle({
				id: "a",
				make: "A",
				auction_start: new Date(now - 3.9 * 3_600_000).toISOString(),
			}),
			makeVehicle({
				id: "b",
				make: "B",
				auction_start: new Date(now - 2 * 3_600_000).toISOString(),
			}),
		];
		render(
			<MemoryRouter>
				<EndingSoonStrip vehicles={vehicles} now={now} />
			</MemoryRouter>,
		);
		const links = screen.getAllByRole("link");
		// First link should be vehicle A (closest to ending)
		expect(links[0]).toHaveAttribute("href", "/vehicles/a");
		expect(links[1]).toHaveAttribute("href", "/vehicles/b");
		expect(links[2]).toHaveAttribute("href", "/vehicles/c");
	});

	it("renders vehicle links to detail pages", () => {
		const now = Date.now();
		const vehicles = [
			makeVehicle({
				id: "abc-123",
				auction_start: new Date(now - 1000).toISOString(),
			}),
		];
		render(
			<MemoryRouter>
				<EndingSoonStrip vehicles={vehicles} now={now} />
			</MemoryRouter>,
		);
		expect(screen.getByRole("link")).toHaveAttribute(
			"href",
			"/vehicles/abc-123",
		);
	});

	it("renders price using current_bid fallback to starting_bid", () => {
		const now = Date.now();
		const vehicles = [
			makeVehicle({
				current_bid: 15000,
				auction_start: new Date(now - 1000).toISOString(),
			}),
		];
		render(
			<MemoryRouter>
				<EndingSoonStrip vehicles={vehicles} now={now} />
			</MemoryRouter>,
		);
		expect(screen.getByText("$15,000")).toBeInTheDocument();
	});

	it("renders themed placeholder image", () => {
		const now = Date.now();
		const vehicles = [
			makeVehicle({
				year: 2024,
				make: "Toyota",
				model: "Camry",
				auction_start: new Date(now - 1000).toISOString(),
			}),
		];
		render(
			<MemoryRouter>
				<EndingSoonStrip vehicles={vehicles} now={now} />
			</MemoryRouter>,
		);
		const img = screen.getByRole("img");
		expect(img.getAttribute("src")).toContain(
			"placehold.co/800x600/141416/71717A",
		);
		expect(img).toHaveAttribute("alt", "2024 Toyota Camry");
	});
});
