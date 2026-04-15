import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { useFilters } from "./useFilters";

function wrapper(initialEntries: string[] = ["/"]) {
	return function Wrapper({ children }: { children: ReactNode }) {
		return createElement(MemoryRouter, { initialEntries }, children);
	};
}

describe("useFilters", () => {
	it("returns default filters when URL is empty", () => {
		const { result } = renderHook(() => useFilters(), { wrapper: wrapper() });
		expect(result.current.filters.query).toBe("");
		expect(result.current.filters.sort).toBe("ending_soon");
		expect(result.current.filters.bodyStyle).toEqual([]);
	});

	it("parses initial filters from URL", () => {
		const { result } = renderHook(() => useFilters(), {
			wrapper: wrapper(["/?query=Ford&bodyStyle=truck&sort=price_asc"]),
		});
		expect(result.current.filters.query).toBe("Ford");
		expect(result.current.filters.bodyStyle).toEqual(["truck"]);
		expect(result.current.filters.sort).toBe("price_asc");
	});

	it("setQuery updates URL state", () => {
		const { result } = renderHook(() => useFilters(), { wrapper: wrapper() });
		act(() => {
			result.current.setQuery("BMW");
		});
		expect(result.current.filters.query).toBe("BMW");
	});

	it("setFilter toggles array values (add then remove)", () => {
		const { result } = renderHook(() => useFilters(), { wrapper: wrapper() });
		act(() => {
			result.current.setFilter("bodyStyle", "SUV");
		});
		expect(result.current.filters.bodyStyle).toEqual(["SUV"]);
		act(() => {
			result.current.setFilter("bodyStyle", "SUV");
		});
		expect(result.current.filters.bodyStyle).toEqual([]);
	});

	it("setSort updates the sort value", () => {
		const { result } = renderHook(() => useFilters(), { wrapper: wrapper() });
		act(() => {
			result.current.setSort("year_desc");
		});
		expect(result.current.filters.sort).toBe("year_desc");
	});

	it("setRange updates a numeric range and accepts 0", () => {
		const { result } = renderHook(() => useFilters(), { wrapper: wrapper() });
		act(() => {
			result.current.setRange("priceMin", 0);
		});
		expect(result.current.filters.priceMin).toBe(0);
		act(() => {
			result.current.setRange("priceMin", null);
		});
		expect(result.current.filters.priceMin).toBeNull();
	});

	it("clearFilters resets all filters to defaults", () => {
		const { result } = renderHook(() => useFilters(), {
			wrapper: wrapper(["/?query=BMW&bodyStyle=SUV&priceMin=1000"]),
		});
		expect(result.current.filters.query).toBe("BMW");
		act(() => {
			result.current.clearFilters();
		});
		expect(result.current.filters.query).toBe("");
		expect(result.current.filters.bodyStyle).toEqual([]);
		expect(result.current.filters.priceMin).toBeNull();
	});
});
