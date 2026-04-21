import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryChips } from "./CategoryChips";

describe("CategoryChips", () => {
	it("renders All Vehicles + 4 body-style chips", () => {
		render(<CategoryChips current={[]} onSelect={() => undefined} />);
		expect(
			screen.getByRole("button", { name: "All Vehicles" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "SUV" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Sedan" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Truck" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Coupe" })).toBeInTheDocument();
	});

	it("marks All Vehicles as pressed when current is empty", () => {
		render(<CategoryChips current={[]} onSelect={() => undefined} />);
		expect(
			screen
				.getByRole("button", { name: "All Vehicles" })
				.getAttribute("aria-pressed"),
		).toBe("true");
	});

	it("marks the matching chip as pressed when current has exactly one value", () => {
		render(<CategoryChips current={["SUV"]} onSelect={() => undefined} />);
		expect(
			screen.getByRole("button", { name: "SUV" }).getAttribute("aria-pressed"),
		).toBe("true");
		expect(
			screen
				.getByRole("button", { name: "All Vehicles" })
				.getAttribute("aria-pressed"),
		).toBe("false");
	});

	it("marks no chip pressed when current has multiple body_style values", () => {
		render(
			<CategoryChips current={["SUV", "sedan"]} onSelect={() => undefined} />,
		);
		expect(
			screen.getByRole("button", { name: "SUV" }).getAttribute("aria-pressed"),
		).toBe("false");
		expect(
			screen
				.getByRole("button", { name: "Sedan" })
				.getAttribute("aria-pressed"),
		).toBe("false");
	});

	it("calls onSelect with matching value on chip click", () => {
		const onSelect = vi.fn();
		render(<CategoryChips current={[]} onSelect={onSelect} />);
		fireEvent.click(screen.getByRole("button", { name: "Sedan" }));
		expect(onSelect).toHaveBeenCalledWith("sedan");
	});

	it("calls onSelect(null) when All Vehicles clicked", () => {
		const onSelect = vi.fn();
		render(<CategoryChips current={["SUV"]} onSelect={onSelect} />);
		fireEvent.click(screen.getByRole("button", { name: "All Vehicles" }));
		expect(onSelect).toHaveBeenCalledWith(null);
	});
});
