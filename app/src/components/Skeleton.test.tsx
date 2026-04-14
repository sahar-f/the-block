import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton, VehicleCardSkeleton } from "./Skeleton";

describe("Skeleton", () => {
	it("renders with aria-hidden", () => {
		const { container } = render(<Skeleton />);
		const el = container.firstElementChild;
		expect(el).toHaveAttribute("aria-hidden", "true");
	});

	it("applies custom className", () => {
		const { container } = render(<Skeleton className="h-10 w-20" />);
		const el = container.firstElementChild;
		expect(el?.className).toContain("h-10");
		expect(el?.className).toContain("w-20");
	});
});

describe("VehicleCardSkeleton", () => {
	it("renders a single status region with skeleton children", () => {
		render(<VehicleCardSkeleton />);
		const wrapper = screen.getByRole("status");
		expect(wrapper).toHaveAttribute("aria-label", "Loading");
		expect(
			wrapper.querySelectorAll("[aria-hidden='true']").length,
		).toBeGreaterThanOrEqual(5);
	});
});
