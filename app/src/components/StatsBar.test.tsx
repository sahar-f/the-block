import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "../types";
import { StatsBar } from "./StatsBar";

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

describe("StatsBar", () => {
	it("renders vehicle count", () => {
		const vehicles = [makeVehicle(), makeVehicle({ id: "v2" })];
		const { container } = render(
			<StatsBar vehicles={vehicles} now={Date.now()} />,
		);
		const stat = container.querySelector('[data-stat="Vehicles"]');
		expect(stat).toHaveTextContent("2");
	});

	it("renders total value from current_bid fallback to starting_bid", () => {
		const vehicles = [
			makeVehicle({ current_bid: 15000 }),
			makeVehicle({ id: "v2", current_bid: null, starting_bid: 10000 }),
		];
		render(<StatsBar vehicles={vehicles} now={Date.now()} />);
		expect(screen.getByText("$25,000")).toBeInTheDocument();
	});

	it("renders Live label", () => {
		render(<StatsBar vehicles={[]} now={Date.now()} />);
		expect(screen.getByText("Live")).toBeInTheDocument();
	});

	it("renders all four stat labels", () => {
		render(<StatsBar vehicles={[]} now={Date.now()} />);
		expect(screen.getByText("Vehicles")).toBeInTheDocument();
		expect(screen.getByText("Live")).toBeInTheDocument();
		expect(screen.getByText("Ending Soon")).toBeInTheDocument();
		expect(screen.getByText("Total Value")).toBeInTheDocument();
	});

	it("renders with empty vehicle list", () => {
		render(<StatsBar vehicles={[]} now={Date.now()} />);
		const zeros = screen.getAllByText("0");
		expect(zeros.length).toBeGreaterThan(0);
		expect(screen.getByText("$0")).toBeInTheDocument();
	});

	it("counts live vehicles", () => {
		const now = Date.now();
		const vehicles = [
			makeVehicle({
				id: "live-1",
				auction_start: new Date(now - 3_600_000).toISOString(),
			}),
			makeVehicle({
				id: "ended-1",
				auction_start: new Date(now - 5 * 3_600_000).toISOString(),
			}),
		];
		const { container } = render(<StatsBar vehicles={vehicles} now={now} />);
		const stat = container.querySelector('[data-stat="Live"]');
		expect(stat).toHaveTextContent("1");
	});

	it("counts ending-soon vehicles (live + timeRemaining < 1 hour)", () => {
		const now = Date.now();
		const vehicles = [
			// Live, 30min remaining — ending soon
			makeVehicle({
				id: "soon-1",
				auction_start: new Date(now - 3.5 * 3_600_000).toISOString(),
			}),
			// Live, 2h remaining — not ending soon
			makeVehicle({
				id: "live-1",
				auction_start: new Date(now - 2 * 3_600_000).toISOString(),
			}),
			// Ended — not counted
			makeVehicle({
				id: "ended-1",
				auction_start: new Date(now - 5 * 3_600_000).toISOString(),
			}),
		];
		const { container } = render(<StatsBar vehicles={vehicles} now={now} />);
		const liveStat = container.querySelector('[data-stat="Live"]');
		const endingSoonStat = container.querySelector('[data-stat="Ending Soon"]');
		expect(liveStat).toHaveTextContent("2");
		expect(endingSoonStat).toHaveTextContent("1");
	});
});
