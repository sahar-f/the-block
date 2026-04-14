import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FilterState } from "../types";
import { FilterPanel } from "./FilterPanel";

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

function renderPanel(overrides: Partial<FilterState> = {}) {
	const props = {
		filters: { ...defaultFilters, ...overrides },
		onFilterChange: vi.fn(),
		onRangeChange: vi.fn(),
		onClear: vi.fn(),
	};
	const result = render(<FilterPanel {...props} />);
	return { ...result, ...props };
}

describe("FilterPanel", () => {
	it("renders filter toggle button", () => {
		renderPanel();
		expect(screen.getByText("Filters")).toBeInTheDocument();
	});

	it("shows filter groups when expanded", async () => {
		renderPanel();
		await userEvent.click(screen.getByText("Filters"));
		expect(screen.getByText("Status")).toBeInTheDocument();
		expect(screen.getByText("Body Style")).toBeInTheDocument();
		expect(screen.getByText("Province")).toBeInTheDocument();
	});

	it("calls onFilterChange when chip clicked", async () => {
		const { onFilterChange } = renderPanel();
		await userEvent.click(screen.getByText("Filters"));
		await userEvent.click(screen.getByText("SUV"));
		expect(onFilterChange).toHaveBeenCalledWith("bodyStyle", "SUV");
	});

	it("highlights active filter chips", async () => {
		renderPanel({ bodyStyle: ["SUV"] });
		await userEvent.click(screen.getByText("Filters"));
		const chip = screen.getByText("SUV");
		expect(chip.className).toContain("text-accent");
	});

	it("shows active filter count", () => {
		renderPanel({ bodyStyle: ["SUV", "sedan"], province: ["Ontario"] });
		expect(screen.getByText("3")).toBeInTheDocument();
	});

	it("shows clear all when filters active", async () => {
		renderPanel({ bodyStyle: ["SUV"] });
		await userEvent.click(screen.getByText("Filters"));
		expect(screen.getByText("Clear all filters")).toBeInTheDocument();
	});

	it("hides clear all when no filters active", async () => {
		renderPanel();
		await userEvent.click(screen.getByText("Filters"));
		expect(screen.queryByText("Clear all filters")).toBeNull();
	});

	it("calls onClear when clear all clicked", async () => {
		const { onClear } = renderPanel({ bodyStyle: ["SUV"] });
		await userEvent.click(screen.getByText("Filters"));
		await userEvent.click(screen.getByText("Clear all filters"));
		expect(onClear).toHaveBeenCalled();
	});

	it("renders price range inputs", async () => {
		renderPanel();
		await userEvent.click(screen.getByText("Filters"));
		expect(screen.getByLabelText("Minimum price")).toBeInTheDocument();
		expect(screen.getByLabelText("Maximum price")).toBeInTheDocument();
	});

	it("renders condition range inputs", async () => {
		renderPanel();
		await userEvent.click(screen.getByText("Filters"));
		expect(screen.getByLabelText("Minimum condition")).toBeInTheDocument();
		expect(screen.getByLabelText("Maximum condition")).toBeInTheDocument();
	});
});
