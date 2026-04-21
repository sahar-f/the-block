import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
	it("renders with aria-label and aria-pressed=false when light", () => {
		render(<ThemeToggle isDark={false} onToggle={() => undefined} />);
		const btn = screen.getByRole("button", { name: /toggle theme/i });
		expect(btn.getAttribute("aria-pressed")).toBe("false");
	});

	it("renders with aria-pressed=true when dark", () => {
		render(<ThemeToggle isDark={true} onToggle={() => undefined} />);
		const btn = screen.getByRole("button", { name: /toggle theme/i });
		expect(btn.getAttribute("aria-pressed")).toBe("true");
	});

	it("calls onToggle on click", () => {
		const onToggle = vi.fn();
		render(<ThemeToggle isDark={false} onToggle={onToggle} />);
		fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
		expect(onToggle).toHaveBeenCalledOnce();
	});

	it("renders an icon (Sun or Moon) inside", () => {
		render(<ThemeToggle isDark={false} onToggle={() => undefined} />);
		const btn = screen.getByRole("button", { name: /toggle theme/i });
		expect(btn.querySelector("svg")).toBeInTheDocument();
	});
});
