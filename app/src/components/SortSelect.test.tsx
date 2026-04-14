import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SortSelect } from "./SortSelect";

describe("SortSelect", () => {
	it("renders all 6 sort options", () => {
		render(<SortSelect value="ending_soon" onChange={vi.fn()} />);
		const select = screen.getByRole("combobox", { name: "Sort vehicles" });
		expect(select.querySelectorAll("option")).toHaveLength(6);
	});

	it("calls onChange with selected value", async () => {
		const onChange = vi.fn();
		render(<SortSelect value="ending_soon" onChange={onChange} />);

		const select = screen.getByRole("combobox", { name: "Sort vehicles" });
		await userEvent.selectOptions(select, "price_asc");
		expect(onChange).toHaveBeenCalledWith("price_asc");
	});

	it("shows currently selected option", () => {
		render(<SortSelect value="price_desc" onChange={vi.fn()} />);
		const select = screen.getByRole("combobox") as HTMLSelectElement;
		expect(select.value).toBe("price_desc");
	});
});
