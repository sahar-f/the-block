import { useEffect, useRef, useState } from "react";
import { useBid } from "../hooks/useBid";
import {
	getAuctionStatus,
	getMinimumBid,
	parseAuctionStart,
} from "../lib/auction";
import { AWAY_THRESHOLD_MS, MIN_BID_INCREMENT } from "../lib/constants";
import {
	formatCurrency,
	formatTimeRemaining,
	getDisplayPrice,
} from "../lib/format";
import type { AuctionStatus, BidError, Vehicle } from "../types";
import { AuctionBadge } from "./AuctionBadge";

type BidPanelProps = {
	vehicle: Vehicle;
	now: number;
};

type ReserveTone = "neutral" | "success" | "muted";

function getReserveLabel(vehicle: Vehicle): {
	label: string;
	tone: ReserveTone;
} {
	if (vehicle.reserve_price === null) {
		return { label: "No Reserve", tone: "neutral" };
	}
	if (
		vehicle.current_bid !== null &&
		vehicle.current_bid >= vehicle.reserve_price
	) {
		return { label: "Reserve Met", tone: "success" };
	}
	return { label: "Reserve Not Met", tone: "muted" };
}

const reserveStyles: Record<ReserveTone, string> = {
	neutral: "bg-blue-500/15 text-blue-400",
	success: "bg-success/15 text-success",
	muted: "bg-border text-text-muted",
};

function errorMessage(error: BidError): string {
	if (error.type === "bid_too_low") {
		return `Bid must be at least ${formatCurrency(error.minimum)}.`;
	}
	if (error.type === "auction_ended") {
		return "This auction has ended.";
	}
	return "Something went wrong. Please try again.";
}

export function BidPanel({ vehicle, now }: BidPanelProps) {
	const auctionStart = parseAuctionStart(vehicle.auction_start);
	const auctionState = getAuctionStatus(auctionStart, now);
	const { submit, buyNow, isPending, error, lastBid } = useBid(vehicle.id);
	const minBid = getMinimumBid(vehicle);
	const [amount, setAmount] = useState(() => String(minBid));

	// Track status transition from live → ended with a time jump > AWAY_THRESHOLD_MS,
	// which indicates the tab was backgrounded (e.g., browser sleep).
	// Seed with null so we only register "wasLive" from an observed live state.
	const prevStatus = useRef<AuctionStatus | null>(null);
	const prevTimeRemaining = useRef<number>(auctionState.timeRemaining);
	const [endedWhileAway, setEndedWhileAway] = useState(false);

	useEffect(() => {
		const wasLive = prevStatus.current === "live";
		const isNowEnded = auctionState.status === "ended";
		if (wasLive && isNowEnded) {
			const jump = prevTimeRemaining.current - auctionState.timeRemaining;
			if (jump > AWAY_THRESHOLD_MS) setEndedWhileAway(true);
		}
		prevStatus.current = auctionState.status;
		prevTimeRemaining.current = auctionState.timeRemaining;
	}, [auctionState.status, auctionState.timeRemaining]);

	const reserve = getReserveLabel(vehicle);
	const displayPrice = getDisplayPrice(vehicle);
	const hasCurrentBid = vehicle.current_bid !== null;

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const n = Number.parseInt(amount, 10);
		// Defense-in-depth: useBid also validates, but block obviously-invalid amounts locally.
		if (!Number.isInteger(n) || n < minBid) return;
		void submit(n);
	}

	function handleBuyNow() {
		if (vehicle.buy_now_price === null) return;
		const confirmed = window.confirm(
			`Buy now for ${formatCurrency(vehicle.buy_now_price)}?`,
		);
		if (!confirmed) return;
		void buyNow();
	}

	const showBidControls = auctionState.status === "live";
	const showBuyNow = showBidControls && vehicle.buy_now_price !== null;
	const parsedAmount = Number.parseInt(amount, 10);
	const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : minBid;

	const countdownLabel =
		auctionState.status === "upcoming"
			? `Starts in ${formatTimeRemaining(auctionState.timeRemaining)}`
			: auctionState.status === "live"
				? `Ends in ${formatTimeRemaining(auctionState.timeRemaining)}`
				: "Ended";

	return (
		<aside className="rounded-lg border border-border bg-surface p-6">
			<div className="mb-3 flex items-center justify-between gap-3">
				<AuctionBadge status={auctionState.status} />
				<span
					className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${reserveStyles[reserve.tone]}`}
				>
					{reserve.label}
				</span>
			</div>

			<div className="mb-2">
				{!hasCurrentBid ? (
					<p className="text-xs uppercase tracking-wider text-text-muted">
						Starting bid
					</p>
				) : null}
				<p className="font-mono text-3xl font-semibold text-accent">
					{formatCurrency(displayPrice)}
				</p>
				<p className="text-sm text-text-muted">
					{vehicle.bid_count === 0
						? "No bids yet — be the first!"
						: `${String(vehicle.bid_count)} bid${vehicle.bid_count !== 1 ? "s" : ""}`}
				</p>
			</div>

			<p className="mb-4 font-mono text-xs text-text-secondary">
				{countdownLabel}
			</p>

			{endedWhileAway ? (
				<div className="mb-4 rounded-md border border-border bg-page p-3 text-sm text-text-secondary">
					This auction ended while you were away. Final price:{" "}
					<span className="font-mono font-semibold text-text-primary">
						{formatCurrency(displayPrice)}
					</span>
					.
				</div>
			) : null}

			{showBidControls ? (
				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label
							htmlFor="bid-amount"
							className="mb-1.5 block text-xs uppercase tracking-wider text-text-muted"
						>
							Your Bid
						</label>
						<input
							id="bid-amount"
							type="number"
							inputMode="numeric"
							min={minBid}
							step={MIN_BID_INCREMENT}
							value={amount}
							onChange={(e) => {
								setAmount(e.target.value);
							}}
							className="w-full rounded-lg border border-border bg-page px-3 py-2.5 font-mono text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
						/>
						<p className="mt-1 text-xs text-text-muted">
							Minimum: {formatCurrency(minBid)}
						</p>
					</div>

					{error ? (
						<p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
							{errorMessage(error)}
						</p>
					) : null}
					{lastBid ? (
						<p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
							Bid placed!
						</p>
					) : null}

					<button
						type="submit"
						disabled={isPending}
						aria-label={`Place a bid on ${String(vehicle.year)} ${vehicle.make} ${vehicle.model}`}
						className="w-full rounded-lg bg-accent py-2.5 font-medium text-page transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
					>
						{isPending
							? "Placing bid…"
							: `Place Bid — ${formatCurrency(safeAmount)}`}
					</button>

					{showBuyNow && vehicle.buy_now_price !== null ? (
						<button
							type="button"
							onClick={handleBuyNow}
							disabled={isPending}
							aria-label={`Buy now for ${formatCurrency(vehicle.buy_now_price)}`}
							className="w-full rounded-lg border border-accent py-2.5 font-medium text-accent transition-all hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
						>
							Buy Now — {formatCurrency(vehicle.buy_now_price)}
						</button>
					) : null}
				</form>
			) : auctionState.status === "ended" ? (
				<div className="rounded-md border border-border bg-page p-3 text-center">
					<p className="text-sm text-text-muted">Auction ended</p>
					<p className="mt-1 font-mono text-lg font-semibold text-text-primary">
						{formatCurrency(displayPrice)}
					</p>
				</div>
			) : (
				<p className="text-sm text-text-muted">
					Bidding opens in {formatTimeRemaining(auctionState.timeRemaining)}.
				</p>
			)}
		</aside>
	);
}
