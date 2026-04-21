import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders with placeholder", () => {
		render(<SearchBar value="" onChange={vi.fn()} />);
		expect(screen.getByPlaceholderText(/search by make/i)).toBeInTheDocument();
	});

	it("calls onChange after debounce", () => {
		const onChange = vi.fn();
		render(<SearchBar value="" onChange={onChange} />);

		const input = screen.getByRole("searchbox", { name: "Search vehicles" });
		fireEvent.change(input, { target: { value: "Ford" } });

		expect(onChange).not.toHaveBeenCalled();
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(onChange).toHaveBeenCalledWith("Ford");
	});

	it("does not call onChange before debounce completes", () => {
		const onChange = vi.fn();
		render(<SearchBar value="" onChange={onChange} />);

		const input = screen.getByRole("searchbox", { name: "Search vehicles" });
		fireEvent.change(input, { target: { value: "F" } });

		act(() => {
			vi.advanceTimersByTime(100);
		});
		expect(onChange).not.toHaveBeenCalled();
	});

	it("clear button calls onChange immediately", () => {
		const onChange = vi.fn();
		render(<SearchBar value="Ford" onChange={onChange} />);

		const clearBtn = screen.getByLabelText("Clear search");
		fireEvent.click(clearBtn);

		expect(onChange).toHaveBeenCalledWith("");
	});

	it("hides clear button when empty", () => {
		render(<SearchBar value="" onChange={vi.fn()} />);
		expect(screen.queryByLabelText("Clear search")).toBeNull();
	});

	it("syncs with external value changes", () => {
		const { rerender } = render(<SearchBar value="old" onChange={vi.fn()} />);
		rerender(<SearchBar value="new" onChange={vi.fn()} />);

		const input = screen.getByRole("searchbox", {
			name: "Search vehicles",
		}) as HTMLInputElement;
		expect(input.value).toBe("new");
	});
});
