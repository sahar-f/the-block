import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Vehicle } from "../types";

const mockUseVehicle = vi.fn();
vi.mock("../hooks/useVehicle", () => ({
	useVehicle: (id: string) => mockUseVehicle(id),
}));

vi.mock("../hooks/useNow", () => ({
	useNow: () => Date.now(),
}));

vi.mock("../hooks/useBid", () => ({
	useBid: () => ({
		submit: vi.fn(),
		buyNow: vi.fn(),
		isPending: false,
		error: null,
		lastBid: null,
	}),
}));

vi.mock("../lib/auction", async () => {
	const actual =
		await vi.importActual<typeof import("../lib/auction")>("../lib/auction");
	return {
		...actual,
		getAuctionStatus: () => ({
			status: "live" as const,
			timeRemaining: 7_200_000,
		}),
	};
});

const { VehiclePage } = await import("./VehiclePage");

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
	return {
		id: "v1",
		vin: "VIN123",
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
		condition_report: "Clean report",
		damage_notes: [],
		title_status: "clean",
		province: "Ontario",
		city: "Toronto",
		auction_start: new Date().toISOString(),
		starting_bid: 10000,
		reserve_price: null,
		buy_now_price: null,
		images: ["a.jpg"],
		selling_dealership: "Dealer",
		lot: "A-0001",
		current_bid: 15000,
		bid_count: 3,
		...overrides,
	};
}

function renderAt(id: string) {
	return render(
		<MemoryRouter initialEntries={[`/vehicles/${id}`]}>
			<Routes>
				<Route path="/vehicles/:id" element={<VehiclePage />} />
				<Route path="*" element={<div>NotFound</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("VehiclePage", () => {
	afterEach(() => {
		mockUseVehicle.mockReset();
	});

	it("shows loading skeleton", () => {
		mockUseVehicle.mockReturnValue({
			data: null,
			isLoading: true,
			error: null,
		});
		renderAt("v1");
		expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
	});

	it("renders NotFoundPage inline when data is null without error", () => {
		mockUseVehicle.mockReturnValue({
			data: null,
			isLoading: false,
			error: null,
		});
		renderAt("does-not-exist");
		// NotFoundPage shows "404" and "Page not found"
		expect(
			screen.getByRole("heading", { level: 1, name: "404" }),
		).toBeInTheDocument();
		expect(screen.getByText(/page not found/i)).toBeInTheDocument();
	});

	it("shows error state", () => {
		mockUseVehicle.mockReturnValue({
			data: null,
			isLoading: false,
			error: "Boom",
		});
		renderAt("v1");
		expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
		expect(screen.getByText("Boom")).toBeInTheDocument();
	});

	it("renders vehicle title with year/make/model/trim", () => {
		mockUseVehicle.mockReturnValue({
			data: makeVehicle(),
			isLoading: false,
			error: null,
		});
		renderAt("v1");
		expect(
			screen.getByRole("heading", { level: 1, name: /2024 Toyota Camry SE/i }),
		).toBeInTheDocument();
	});

	it("renders lot and VIN", () => {
		mockUseVehicle.mockReturnValue({
			data: makeVehicle({ lot: "A-0001", vin: "VIN123" }),
			isLoading: false,
			error: null,
		});
		renderAt("v1");
		expect(screen.getByText("Lot A-0001")).toBeInTheDocument();
		expect(screen.getByText("VIN VIN123")).toBeInTheDocument();
	});

	it("sets document title", () => {
		mockUseVehicle.mockReturnValue({
			data: makeVehicle({ year: 2024, make: "Toyota", model: "Camry" }),
			isLoading: false,
			error: null,
		});
		renderAt("v1");
		expect(document.title).toBe("The Block | 2024 Toyota Camry");
	});

	it("renders back-to-inventory link", () => {
		mockUseVehicle.mockReturnValue({
			data: makeVehicle(),
			isLoading: false,
			error: null,
		});
		renderAt("v1");
		const link = screen.getByRole("link", { name: /back to inventory/i });
		expect(link).toHaveAttribute("href", "/");
	});
});
