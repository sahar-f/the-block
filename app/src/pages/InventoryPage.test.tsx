import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../hooks/useTheme";
import type { Vehicle } from "../types";

function Wrap({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider value={{ isDark: false, toggle: () => undefined }}>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
}

const defaultFilters = {
	query: "",
	bodyStyle: [] as string[],
	province: [] as string[],
	drivetrain: [] as string[],
	fuelType: [] as string[],
	transmission: [] as string[],
	titleStatus: [] as string[],
	auctionStatus: [] as string[],
	priceMin: null as number | null,
	priceMax: null as number | null,
	conditionMin: null as number | null,
	conditionMax: null as number | null,
	sort: "ending_soon" as const,
};

const mockFilters = { current: defaultFilters };

vi.mock("../hooks/useFilters", () => ({
	useFilters: () => ({
		filters: mockFilters.current,
		setQuery: vi.fn(),
		setFilter: vi.fn(),
		setSort: vi.fn(),
		setRange: vi.fn(),
		clearFilters: vi.fn(),
		setBodyStyleOnly: vi.fn(),
	}),
}));

const mockUseVehicles = vi.fn();
vi.mock("../hooks/useVehicles", () => ({
	useVehicles: (...args: unknown[]) => mockUseVehicles(...args),
}));

vi.mock("../hooks/useNow", () => ({
	useNow: () => Date.now(),
}));

vi.mock("../lib/auction", () => ({
	parseAuctionStart: (iso: string) => new Date(iso).getTime(),
	getAuctionStatus: () => ({ status: "live" as const, timeRemaining: 60000 }),
}));

const { InventoryPage } = await import("./InventoryPage");

function makeVehicle(id: string): Vehicle {
	return {
		id,
		vin: `VIN${id}`,
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
		odometer_km: 15000,
		fuel_type: "gasoline",
		condition_grade: 4.0,
		condition_report: "Good",
		damage_notes: [],
		title_status: "clean",
		province: "Ontario",
		city: "Toronto",
		auction_start: new Date().toISOString(),
		starting_bid: 25000,
		reserve_price: null,
		buy_now_price: null,
		images: ["https://placehold.co/800x600"],
		selling_dealership: "Dealer",
		lot: "A-0001",
		current_bid: 26000,
		bid_count: 5,
	};
}

describe("InventoryPage", () => {
	afterEach(() => {
		mockFilters.current = defaultFilters;
	});

	it("shows loading skeletons with controls visible", () => {
		mockUseVehicles.mockReturnValue({
			data: [],
			allVehicles: [],
			isLoading: true,
			error: null,
		});
		render(
			<Wrap>
				<InventoryPage />
			</Wrap>,
		);
		const skeletons = screen.getAllByRole("status");
		expect(skeletons.length).toBe(8);
		expect(
			screen.getByRole("searchbox", { name: "Search vehicles" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("combobox", { name: "Sort vehicles" }),
		).toBeInTheDocument();
	});

	it("shows error state", () => {
		mockUseVehicles.mockReturnValue({
			data: [],
			allVehicles: [],
			isLoading: false,
			error: "Failed to load",
		});
		render(
			<Wrap>
				<InventoryPage />
			</Wrap>,
		);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.getByText("Failed to load")).toBeInTheDocument();
	});

	it("shows empty-filter state with clear CTA when filters are active", () => {
		mockFilters.current = { ...defaultFilters, query: "nonexistent" };
		mockUseVehicles.mockReturnValue({
			data: [],
			allVehicles: [makeVehicle("1")],
			isLoading: false,
			error: null,
		});
		render(
			<Wrap>
				<InventoryPage />
			</Wrap>,
		);
		expect(
			screen.getByText("No vehicles match your filters"),
		).toBeInTheDocument();
		expect(screen.getByText("Clear all filters")).toBeInTheDocument();
	});

	it("shows empty-marketplace state without clear CTA when no filters active", () => {
		mockUseVehicles.mockReturnValue({
			data: [],
			allVehicles: [],
			isLoading: false,
			error: null,
		});
		render(
			<Wrap>
				<InventoryPage />
			</Wrap>,
		);
		expect(screen.getByText("No vehicles available yet")).toBeInTheDocument();
		expect(screen.queryByText("Clear all filters")).toBeNull();
	});

	it("renders vehicle cards when data loads", () => {
		const vehicles = [makeVehicle("1"), makeVehicle("2")];
		mockUseVehicles.mockReturnValue({
			data: vehicles,
			allVehicles: vehicles,
			isLoading: false,
			error: null,
		});
		render(
			<Wrap>
				<InventoryPage />
			</Wrap>,
		);
		expect(screen.getByText("2 vehicles available")).toBeInTheDocument();
		const links = screen.getAllByRole("link");
		expect(links.length).toBeGreaterThanOrEqual(2);
	});

	it("renders search and sort controls", () => {
		const vehicles = [makeVehicle("1")];
		mockUseVehicles.mockReturnValue({
			data: vehicles,
			allVehicles: vehicles,
			isLoading: false,
			error: null,
		});
		render(
			<Wrap>
				<InventoryPage />
			</Wrap>,
		);
		expect(
			screen.getByRole("searchbox", { name: "Search vehicles" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("combobox", { name: "Sort vehicles" }),
		).toBeInTheDocument();
		expect(screen.getByText("Filters")).toBeInTheDocument();
	});

	it("shows singular vehicle text for 1 result", () => {
		const vehicles = [makeVehicle("1")];
		mockUseVehicles.mockReturnValue({
			data: vehicles,
			allVehicles: vehicles,
			isLoading: false,
			error: null,
		});
		render(
			<Wrap>
				<InventoryPage />
			</Wrap>,
		);
		expect(screen.getByText("1 vehicle available")).toBeInTheDocument();
	});
});
