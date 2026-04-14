import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
	throw new Error("boom");
}

describe("ErrorBoundary", () => {
	// React logs the caught error to console.error during render; silence it in tests
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it("renders children when no error thrown", () => {
		render(
			<MemoryRouter>
				<ErrorBoundary>
					<p>hello</p>
				</ErrorBoundary>
			</MemoryRouter>,
		);
		expect(screen.getByText("hello")).toBeInTheDocument();
	});

	it("renders fallback UI with Browse link when child throws", () => {
		render(
			<MemoryRouter>
				<ErrorBoundary>
					<Boom />
				</ErrorBoundary>
			</MemoryRouter>,
		);
		expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
		const browseLink = screen.getByRole("link", {
			name: /browse all vehicles/i,
		});
		expect(browseLink).toHaveAttribute("href", "/");
	});
});
