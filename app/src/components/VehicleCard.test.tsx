import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { getAuctionStatus } from "../lib/auction";
import type { Vehicle } from "../types";
import { VehicleCard } from "./VehicleCard";

vi.mock("../lib/auction", () => ({
	parseAuctionStart: (iso: string) => new Date(iso).getTime(),
	getAuctionStatus: vi.fn(() => ({
		status: "live" as const,
		timeRemaining: 7_200_000,
	})),
}));

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
	return {
		id: "test-id",
		vin: "VIN123",
		year: 2024,
		make: "Toyota",
		model: "Camry",
		trim: "SE",
		body_style: "sedan",
		exterior_color: "White",
		interior_color: "Black",
		engine: "2.5L I4",
		transmission: "automatic",
		drivetrain: "FWD",
		odometer_km: 15000,
		fuel_type: "gasoline",
		condition_grade: 4.2,
		condition_report: "Good",
		damage_notes: [],
		title_status: "clean",
		province: "Ontario",
		city: "Toronto",
		auction_start: new Date().toISOString(),
		starting_bid: 25000,
		reserve_price: null,
		buy_now_price: null,
		images: ["https://placehold.co/800x600?text=Car"],
		selling_dealership: "Test Dealer",
		lot: "A-0001",
		current_bid: 26000,
		bid_count: 5,
		...overrides,
	};
}

function renderCard(overrides: Partial<Vehicle> = {}) {
	return render(
		<MemoryRouter>
			<VehicleCard
				vehicle={makeVehicle(overrides)}
				index={0}
				now={Date.now()}
			/>
		</MemoryRouter>,
	);
}

describe("VehicleCard", () => {
	it("renders vehicle title", () => {
		renderCard();
		expect(screen.getByText(/2024 Toyota Camry/)).toBeInTheDocument();
		expect(screen.getByText("SE")).toBeInTheDocument();
	});

	it("renders current bid when present", () => {
		renderCard({ current_bid: 26000 });
		expect(screen.getByText("$26,000")).toBeInTheDocument();
	});

	it("renders starting bid when no current bid", () => {
		renderCard({ current_bid: null, starting_bid: 25000 });
		expect(screen.getByText("$25,000")).toBeInTheDocument();
		expect(screen.getByText("Starting bid")).toBeInTheDocument();
	});

	it("renders bid count", () => {
		renderCard({ bid_count: 5 });
		expect(screen.getByText("5 bids")).toBeInTheDocument();
	});

	it("renders singular bid text for 1 bid", () => {
		renderCard({ bid_count: 1 });
		expect(screen.getByText("1 bid")).toBeInTheDocument();
	});

	it("renders lot number", () => {
		renderCard({ lot: "A-0001" });
		expect(screen.getByText("A-0001")).toBeInTheDocument();
	});

	it("renders location and dealership together", () => {
		renderCard({
			city: "Toronto",
			province: "Ontario",
			selling_dealership: "Test Dealer",
		});
		expect(screen.getByText(/Toronto, Ontario/)).toBeInTheDocument();
		expect(screen.getByText(/Test Dealer/)).toBeInTheDocument();
	});

	it("links to vehicle detail page", () => {
		renderCard({ id: "abc-123" });
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/vehicles/abc-123");
	});

	it("renders themed placeholder image with alt text", () => {
		renderCard({ year: 2024, make: "Toyota", model: "Camry" });
		const img = screen.getByRole("img");
		expect(img).toHaveAttribute("alt", "2024 Toyota Camry");
		expect(img.getAttribute("src")).toContain(
			"placehold.co/800x600/141416/71717A",
		);
		expect(img).toHaveAttribute("loading", "lazy");
	});

	it("renders auction badge", () => {
		renderCard();
		expect(screen.getByText("Live")).toBeInTheDocument();
	});

	it("renders condition badge", () => {
		renderCard({ condition_grade: 4.2 });
		expect(screen.getByText("4.2")).toBeInTheDocument();
	});

	it("shows live countdown for live auctions", () => {
		renderCard();
		expect(screen.getByText("2h 0m")).toBeInTheDocument();
	});

	it("hides countdown for ended auctions", () => {
		vi.mocked(getAuctionStatus).mockReturnValueOnce({
			status: "ended" as const,
			timeRemaining: 0,
		});
		renderCard();
		expect(screen.queryByText(/\d+h \d+m/)).toBeNull();
		expect(screen.queryByText(/\d+m \d+s/)).toBeNull();
	});

	it("hides countdown for upcoming auctions", () => {
		vi.mocked(getAuctionStatus).mockReturnValueOnce({
			status: "upcoming" as const,
			timeRemaining: 3_600_000,
		});
		renderCard();
		expect(screen.queryByText(/\d+h \d+m/)).toBeNull();
		expect(screen.queryByText(/\d+m \d+s/)).toBeNull();
	});

	it("shows Car icon fallback when image fails to load", () => {
		renderCard({ year: 2024, make: "Toyota", model: "Camry" });
		const img = screen.getByRole("img");
		fireEvent.error(img);
		// After error, the img element is unmounted and replaced with fallback
		expect(screen.queryByRole("img")).toBeNull();
		// Alt text appears as the fallback label
		expect(screen.getAllByText("2024 Toyota Camry").length).toBeGreaterThan(0);
	});
});
