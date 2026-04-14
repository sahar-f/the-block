import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConditionBadge } from "./ConditionBadge";

describe("ConditionBadge", () => {
	it("shows green for grade >= 4", () => {
		render(<ConditionBadge grade={4.2} />);
		const badge = screen.getByText("4.2");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("text-success");
	});

	it("shows yellow for grade >= 3 and < 4", () => {
		render(<ConditionBadge grade={3.5} />);
		const badge = screen.getByText("3.5");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("text-warning");
	});

	it("shows red for grade < 3", () => {
		render(<ConditionBadge grade={2.1} />);
		const badge = screen.getByText("2.1");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("text-error");
	});

	it("formats to one decimal place", () => {
		render(<ConditionBadge grade={4} />);
		expect(screen.getByText("4.0")).toBeInTheDocument();
	});
});
