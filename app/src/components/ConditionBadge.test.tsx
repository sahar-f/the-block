import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConditionBadge } from "./ConditionBadge";

describe("ConditionBadge", () => {
	it("shows green for grade >= 4", () => {
		render(<ConditionBadge grade={4.2} />);
		const badge = screen.getByLabelText("Condition grade: 4.2 of 5");
		expect(badge.className).toContain("text-success");
		expect(badge).toHaveTextContent("4.2");
	});

	it("shows yellow for grade >= 3 and < 4", () => {
		render(<ConditionBadge grade={3.5} />);
		const badge = screen.getByLabelText("Condition grade: 3.5 of 5");
		expect(badge.className).toContain("text-warning");
		expect(badge).toHaveTextContent("3.5");
	});

	it("shows red for grade < 3", () => {
		render(<ConditionBadge grade={2.1} />);
		const badge = screen.getByLabelText("Condition grade: 2.1 of 5");
		expect(badge.className).toContain("text-error");
		expect(badge).toHaveTextContent("2.1");
	});

	it("formats to one decimal place", () => {
		render(<ConditionBadge grade={4} />);
		expect(
			screen.getByLabelText("Condition grade: 4.0 of 5"),
		).toHaveTextContent("4.0");
	});

	it("exposes an accessible grade label via aria-label", () => {
		render(<ConditionBadge grade={4.2} />);
		expect(
			screen.getByLabelText("Condition grade: 4.2 of 5"),
		).toBeInTheDocument();
	});
});
