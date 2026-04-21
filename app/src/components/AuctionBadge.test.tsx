import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuctionBadge } from "./AuctionBadge";

describe("AuctionBadge", () => {
	it("renders Live with pulsing dot and green styling", () => {
		const { container } = render(<AuctionBadge status="live" />);
		const badge = screen.getByLabelText("Auction status: Live");
		expect(badge.className).toContain("text-success");
		expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
	});

	it("renders Upcoming with blue styling, without dot", () => {
		const { container } = render(<AuctionBadge status="upcoming" />);
		const badge = screen.getByLabelText("Auction status: Upcoming");
		expect(badge.className).toContain("text-accent");
		expect(container.querySelector(".animate-pulse")).toBeNull();
	});

	it("renders Ended with muted styling, without dot", () => {
		const { container } = render(<AuctionBadge status="ended" />);
		const badge = screen.getByLabelText("Auction status: Ended");
		expect(badge.className).toContain("text-text-muted");
		expect(container.querySelector(".animate-pulse")).toBeNull();
	});

	it("exposes an accessible status label via aria-label", () => {
		render(<AuctionBadge status="live" />);
		expect(screen.getByLabelText("Auction status: Live")).toBeInTheDocument();
	});
});
