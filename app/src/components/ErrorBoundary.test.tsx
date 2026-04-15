import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
	throw new Error("boom");
}

function ToggleableBoom() {
	const [crashed, setCrashed] = useState(false);
	if (crashed) throw new Error("boom");
	return (
		<button type="button" onClick={() => setCrashed(true)}>
			crash
		</button>
	);
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

	it("recovers when remounted with a new key (App.tsx pathname-reset behavior)", () => {
		const { rerender } = render(
			<MemoryRouter>
				<ErrorBoundary key="/route-a">
					<ToggleableBoom />
				</ErrorBoundary>
			</MemoryRouter>,
		);

		fireEvent.click(screen.getByRole("button", { name: /crash/i }));
		expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

		// Simulate route change → key changes → ErrorBoundary remounts with hasError reset
		rerender(
			<MemoryRouter>
				<ErrorBoundary key="/route-b">
					<p>recovered</p>
				</ErrorBoundary>
			</MemoryRouter>,
		);
		expect(screen.queryByText(/something went wrong/i)).toBeNull();
		expect(screen.getByText("recovered")).toBeInTheDocument();
	});
});
