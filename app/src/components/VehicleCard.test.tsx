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

	it("renders the first image from the vehicle's images array", () => {
		renderCard({
			year: 2024,
			make: "Toyota",
			model: "Camry",
			images: [
				"https://example.com/photo-1.jpg",
				"https://example.com/photo-2.jpg",
			],
		});
		const img = screen.getByAltText("2024 Toyota Camry");
		expect(img.tagName).toBe("IMG");
		expect(img.getAttribute("src")).toBe("https://example.com/photo-1.jpg");
		expect(img).toHaveAttribute("loading", "lazy");
	});

	it("falls back to the themed placeholder when images is empty", () => {
		renderCard({ year: 2024, make: "Toyota", model: "Camry", images: [] });
		const img = screen.getByAltText("2024 Toyota Camry");
		expect(img.getAttribute("src")).toContain(
			"placehold.co/800x600/141416/71717A",
		);
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

	it("renders as a single link with no nested button", () => {
		renderCard();
		const link = screen.getByRole("link");
		expect(link.querySelectorAll('[role="button"]')).toHaveLength(0);
		expect(link.querySelectorAll("button")).toHaveLength(0);
	});

	it("shows Featured badge when condition >= 4.5 and live", () => {
		renderCard({ condition_grade: 4.7 });
		expect(screen.getByText(/featured/i)).toBeInTheDocument();
	});

	it("does not show Featured badge when condition < 4.5", () => {
		renderCard({ condition_grade: 4.4 });
		expect(screen.queryByText(/featured/i)).toBeNull();
	});

	it("does not show Featured badge for non-live auctions", () => {
		vi.mocked(getAuctionStatus).mockReturnValueOnce({
			status: "ended" as const,
			timeRemaining: 0,
		});
		renderCard({ condition_grade: 4.8 });
		expect(screen.queryByText(/featured/i)).toBeNull();
	});

	it("moves lot badge to bottom-left when Featured is shown", () => {
		renderCard({ condition_grade: 4.7, lot: "A-0001" });
		const lot = screen.getByText("A-0001");
		expect(lot.className).toContain("bottom-3");
		expect(lot.className).toContain("left-3");
	});

	it("renders 'View details' affordance", () => {
		renderCard();
		expect(screen.getByText(/view details/i)).toBeInTheDocument();
	});

	it("renders 2x2 spec grid with year, odometer, condition, status", () => {
		renderCard({
			year: 2024,
			odometer_km: 47731,
			condition_grade: 4.0,
		});
		expect(screen.getByText("2024")).toBeInTheDocument();
		expect(screen.getByText(/47,731\s*km/)).toBeInTheDocument();
		expect(screen.getByText("4.0")).toBeInTheDocument();
	});

	it("shows Car icon fallback when image fails to load", () => {
		renderCard({ year: 2024, make: "Toyota", model: "Camry" });
		const img = screen.getByAltText("2024 Toyota Camry");
		fireEvent.error(img);
		// After error, the <img> tag is unmounted and replaced with a styled fallback
		expect(screen.queryByAltText("2024 Toyota Camry")).toBeNull();
		// Vehicle name now appears twice: once in the title h3 and once in the
		// fallback caption under the Car icon.
		expect(screen.getAllByText("2024 Toyota Camry").length).toBeGreaterThan(1);
	});
});
