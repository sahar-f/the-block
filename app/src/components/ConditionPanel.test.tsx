import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConditionPanel } from "./ConditionPanel";

describe("ConditionPanel", () => {
	it("renders heading", () => {
		render(<ConditionPanel grade={4.0} report="Good" damageNotes={[]} />);
		expect(
			screen.getByRole("heading", { level: 2, name: /condition/i }),
		).toBeInTheDocument();
	});

	it("renders condition badge and report text", () => {
		render(
			<ConditionPanel grade={4.2} report="Well maintained." damageNotes={[]} />,
		);
		expect(screen.getByText("4.2")).toBeInTheDocument();
		expect(screen.getByText("Well maintained.")).toBeInTheDocument();
	});

	it("renders 'No damage reported' when damageNotes is empty", () => {
		render(<ConditionPanel grade={4.0} report="Good" damageNotes={[]} />);
		expect(screen.getByText(/no damage reported/i)).toBeInTheDocument();
	});

	it("renders each damage note as a list item", () => {
		const notes = ["Scratch on rear bumper", "Hail damage on hood"];
		render(
			<ConditionPanel grade={3.0} report="Some damage" damageNotes={notes} />,
		);
		for (const note of notes) {
			expect(screen.getByText(note)).toBeInTheDocument();
		}
	});

	it("renders damage list as ul when notes present", () => {
		render(
			<ConditionPanel grade={3.0} report="Some" damageNotes={["Scratch"]} />,
		);
		const list = screen.getByRole("list");
		expect(list.tagName).toBe("UL");
	});
});
