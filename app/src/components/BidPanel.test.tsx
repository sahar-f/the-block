import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BidAction } from "../hooks/useBid";
import type { Bid, BidError, Vehicle } from "../types";

vi.mock("../lib/auction", async () => {
	const actual =
		await vi.importActual<typeof import("../lib/auction")>("../lib/auction");
	return {
		...actual,
		getAuctionStatus: vi.fn(() => ({
			status: "live" as const,
			timeRemaining: 7_200_000,
		})),
	};
});

const mockSubmit = vi.fn();
const mockBuyNow = vi.fn();
const mockBidState: {
	submit: typeof mockSubmit;
	buyNow: typeof mockBuyNow;
	isPending: boolean;
	error: BidError | null;
	lastBid: Bid | null;
	lastAction: BidAction | null;
} = {
	submit: mockSubmit,
	buyNow: mockBuyNow,
	isPending: false,
	error: null,
	lastBid: null,
	lastAction: null,
};

vi.mock("../hooks/useBid", () => ({
	useBid: () => mockBidState,
}));

const { getAuctionStatus } = await import("../lib/auction");
const { BidPanel } = await import("./BidPanel");

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
	return {
		id: "v1",
		vin: "VIN123",
		year: 2024,
		make: "Toyota",
		model: "Camry",
		trim: "SE",
		body_style: "sedan",
		exterior_color: "White",
		interior_color: "Black",
		engine: "2.5L",
		transmission: "automatic",
		drivetrain: "FWD",
		odometer_km: 10000,
		fuel_type: "gasoline",
		condition_grade: 4.0,
		condition_report: "Good",
		damage_notes: [],
		title_status: "clean",
		province: "Ontario",
		city: "Toronto",
		auction_start: new Date().toISOString(),
		starting_bid: 10000,
		reserve_price: null,
		buy_now_price: null,
		images: [],
		selling_dealership: "Dealer",
		lot: "A-0001",
		current_bid: 15000,
		bid_count: 3,
		...overrides,
	};
}

function resetBidState() {
	mockBidState.isPending = false;
	mockBidState.error = null;
	mockBidState.lastBid = null;
	mockBidState.lastAction = null;
	mockSubmit.mockReset();
	mockBuyNow.mockReset();
	vi.mocked(getAuctionStatus).mockReturnValue({
		status: "live" as const,
		timeRemaining: 7_200_000,
	});
}

describe("BidPanel", () => {
	afterEach(() => {
		resetBidState();
	});

	it("renders current bid in accent color", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		expect(screen.getByText("$15,000")).toBeInTheDocument();
	});

	it("renders starting bid with label when no current_bid", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({
					current_bid: null,
					starting_bid: 10000,
					bid_count: 0,
				})}
				now={Date.now()}
			/>,
		);
		expect(screen.getByText("$10,000")).toBeInTheDocument();
		expect(screen.getByText(/starting bid/i)).toBeInTheDocument();
	});

	it("renders 'No bids yet — be the first!' when bid_count is 0", () => {
		render(
			<BidPanel vehicle={makeVehicle({ bid_count: 0 })} now={Date.now()} />,
		);
		expect(screen.getByText(/no bids yet/i)).toBeInTheDocument();
	});

	it("shows 'No Reserve' when reserve_price is null", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ reserve_price: null })}
				now={Date.now()}
			/>,
		);
		expect(screen.getByText(/no reserve/i)).toBeInTheDocument();
	});

	it("shows 'Reserve Met' when current_bid >= reserve_price", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ reserve_price: 10000, current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		expect(screen.getByText(/reserve met/i)).toBeInTheDocument();
	});

	it("shows 'Reserve Not Met' when current_bid < reserve_price", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ reserve_price: 20000, current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		expect(screen.getByText(/reserve not met/i)).toBeInTheDocument();
	});

	it("bid input pre-filled with current_bid + 100", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		const input = screen.getByLabelText(/your bid/i) as HTMLInputElement;
		expect(input.value).toBe("15100");
	});

	it("bid input pre-filled with starting_bid when no current_bid", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: null, starting_bid: 10000 })}
				now={Date.now()}
			/>,
		);
		const input = screen.getByLabelText(/your bid/i) as HTMLInputElement;
		expect(input.value).toBe("10000");
	});

	it("hides bid controls when auction is not live (ended)", () => {
		vi.mocked(getAuctionStatus).mockReturnValue({
			status: "ended" as const,
			timeRemaining: 0,
		});
		render(<BidPanel vehicle={makeVehicle()} now={Date.now()} />);
		expect(screen.queryByRole("button", { name: /place bid/i })).toBeNull();
	});

	it("ended state shows 'Auction ended' + final price", () => {
		vi.mocked(getAuctionStatus).mockReturnValue({
			status: "ended" as const,
			timeRemaining: 0,
		});
		render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		expect(screen.getByText(/auction ended/i)).toBeInTheDocument();
	});

	it("upcoming state hides bid controls", () => {
		vi.mocked(getAuctionStatus).mockReturnValue({
			status: "upcoming" as const,
			timeRemaining: 3_600_000,
		});
		render(<BidPanel vehicle={makeVehicle()} now={Date.now()} />);
		expect(screen.queryByRole("button", { name: /place bid/i })).toBeNull();
		expect(screen.getByText(/bidding opens in/i)).toBeInTheDocument();
	});

	it("buy now button renders only when buy_now_price exists AND live", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ buy_now_price: 50000 })}
				now={Date.now()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /buy now/i }),
		).toBeInTheDocument();
	});

	it("buy now does NOT render when buy_now_price is null", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ buy_now_price: null })}
				now={Date.now()}
			/>,
		);
		expect(screen.queryByRole("button", { name: /buy now/i })).toBeNull();
	});

	it("buy now does NOT render when auction is ended", () => {
		vi.mocked(getAuctionStatus).mockReturnValue({
			status: "ended" as const,
			timeRemaining: 0,
		});
		render(
			<BidPanel
				vehicle={makeVehicle({ buy_now_price: 50000 })}
				now={Date.now()}
			/>,
		);
		expect(screen.queryByRole("button", { name: /buy now/i })).toBeNull();
	});

	it("shows bid_too_low error with minimum amount", () => {
		mockBidState.error = {
			type: "bid_too_low",
			minimum: 15500,
			message: "Bid too low",
		};
		render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		expect(
			screen.getByText(/bid must be at least \$15,500/i),
		).toBeInTheDocument();
	});

	it("shows auction_ended error message", () => {
		mockBidState.error = {
			type: "auction_ended",
			message: "Ended",
		};
		render(<BidPanel vehicle={makeVehicle()} now={Date.now()} />);
		expect(screen.getByText(/this auction has ended/i)).toBeInTheDocument();
	});

	it("shows network error fallback", () => {
		mockBidState.error = {
			type: "network",
			message: "Boom",
		};
		render(<BidPanel vehicle={makeVehicle()} now={Date.now()} />);
		expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
	});

	it("calls submit with parsed amount when Place Bid clicked", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		const input = screen.getByLabelText(/your bid/i) as HTMLInputElement;
		fireEvent.change(input, { target: { value: "15200" } });
		const submitBtn = screen.getByRole("button", { name: /place a bid/i });
		fireEvent.click(submitBtn);
		expect(mockSubmit).toHaveBeenCalledWith(15200);
	});

	it("shows below-min visual indicator when typed amount is less than minimum", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		const input = screen.getByLabelText(/your bid/i) as HTMLInputElement;
		// Typed amount is below min (15,100). Input must signal below-min via aria-invalid
		// and via a distinctive class (error border).
		fireEvent.change(input, { target: { value: "14000" } });
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(input.className).toContain("border-error");
	});

	it("clears below-min indicator once typed amount reaches minimum", () => {
		render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		const input = screen.getByLabelText(/your bid/i) as HTMLInputElement;
		fireEvent.change(input, { target: { value: "14000" } });
		expect(input.getAttribute("aria-invalid")).toBe("true");
		fireEvent.change(input, { target: { value: "15100" } });
		expect(input.getAttribute("aria-invalid")).not.toBe("true");
		expect(input.className).not.toContain("border-error");
	});

	it("flashes the price element briefly when current_bid updates", () => {
		const { rerender } = render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15000 })}
				now={Date.now()}
			/>,
		);
		const initialPrice = screen.getByText("$15,000");
		// Initial mount: no flash class
		expect(initialPrice.className).not.toContain("flash-accent");

		// current_bid updates (simulates real-time bid arriving)
		rerender(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15500, bid_count: 4 })}
				now={Date.now()}
			/>,
		);
		const newPrice = screen.getByText("$15,500");
		expect(newPrice.className).toContain("flash-accent");
	});

	it("removes the flash class after PRICE_FLASH_MS", async () => {
		vi.useFakeTimers();
		try {
			const { rerender } = render(
				<BidPanel
					vehicle={makeVehicle({ current_bid: 15000 })}
					now={Date.now()}
				/>,
			);
			rerender(
				<BidPanel
					vehicle={makeVehicle({ current_bid: 15500, bid_count: 4 })}
					now={Date.now()}
				/>,
			);
			expect(screen.getByText("$15,500").className).toContain("flash-accent");

			await act(async () => {
				vi.advanceTimersByTime(700);
			});

			expect(screen.getByText("$15,500").className).not.toContain(
				"flash-accent",
			);
		} finally {
			vi.useRealTimers();
		}
	});

	it("shows 'Sold to you' state and hides the bid form after Buy Now succeeds", () => {
		mockBidState.lastBid = {
			id: "bid-1",
			vehicle_id: "v1",
			amount: 50000,
			bidder_session: "session-1",
			created_at: "2026-04-14T00:00:00Z",
		};
		mockBidState.lastAction = "buy_now";
		render(
			<BidPanel
				vehicle={makeVehicle({ buy_now_price: 50000, current_bid: 50000 })}
				now={Date.now()}
			/>,
		);
		const soldStatus = screen.getByRole("status");
		expect(soldStatus).toHaveTextContent(/sold to you/i);
		expect(soldStatus).toHaveTextContent("$50,000");
		// Bid form is hidden — no Place Bid button or input
		expect(screen.queryByLabelText(/your bid/i)).toBeNull();
		expect(screen.queryByRole("button", { name: /place a bid/i })).toBeNull();
		expect(screen.queryByRole("button", { name: /buy now/i })).toBeNull();
	});

	it("after a regular bid, still shows the bid form with 'Bid placed!' confirmation", () => {
		mockBidState.lastBid = {
			id: "bid-1",
			vehicle_id: "v1",
			amount: 15100,
			bidder_session: "session-1",
			created_at: "2026-04-14T00:00:00Z",
		};
		mockBidState.lastAction = "bid";
		render(
			<BidPanel
				vehicle={makeVehicle({ current_bid: 15100 })}
				now={Date.now()}
			/>,
		);
		expect(screen.getByText(/bid placed/i)).toBeInTheDocument();
		// Form still visible — user can bid again
		expect(screen.getByLabelText(/your bid/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /place a bid/i }),
		).toBeInTheDocument();
	});
});
