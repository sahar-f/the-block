import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../hooks/useTheme";
import { SiteHeader } from "./SiteHeader";

function Wrap({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider value={{ isDark: false, toggle: () => undefined }}>
			<MemoryRouter>{children}</MemoryRouter>
		</ThemeProvider>
	);
}

describe("SiteHeader", () => {
	it("renders banner landmark", () => {
		render(
			<Wrap>
				<SiteHeader />
			</Wrap>,
		);
		expect(screen.getByRole("banner")).toBeInTheDocument();
	});

	it("renders brand link to /", () => {
		render(
			<Wrap>
				<SiteHeader />
			</Wrap>,
		);
		expect(screen.getByRole("link", { name: /the block/i })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("renders subtitle and theme toggle", () => {
		render(
			<Wrap>
				<SiteHeader />
			</Wrap>,
		);
		expect(screen.getByText(/vehicle auctions/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /toggle theme/i }),
		).toBeInTheDocument();
	});
});
