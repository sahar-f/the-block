import { CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBid } from "../hooks/useBid";
import {
	getAuctionStatus,
	getMinimumBid,
	parseAuctionStart,
} from "../lib/auction";
import { cn } from "../lib/cn";
import {
	AWAY_THRESHOLD_MS,
	MIN_BID_INCREMENT,
	PRICE_FLASH_MS,
} from "../lib/constants";
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
	switch (error.type) {
		case "bid_too_low":
			return `Bid must be at least ${formatCurrency(error.minimum)}.`;
		case "auction_ended":
			return "This auction has ended.";
		default:
			return "Something went wrong. Please try again.";
	}
}

export function BidPanel({ vehicle, now }: BidPanelProps) {
	const auctionStart = parseAuctionStart(vehicle.auction_start);
	const auctionState = getAuctionStatus(auctionStart, now);
	const { submit, buyNow, isPending, error, lastBid, lastAction } = useBid(
		vehicle.id,
	);
	const minBid = getMinimumBid(vehicle);
	const [amount, setAmount] = useState(() => String(minBid));

	// Detect "auction ended while tab was backgrounded": a live → ended transition
	// with a time jump > AWAY_THRESHOLD_MS implies the user was away (browser sleep).
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

	const prevCurrentBid = useRef<number | null>(vehicle.current_bid);
	const [priceFlash, setPriceFlash] = useState(false);

	useEffect(() => {
		const prev = prevCurrentBid.current;
		prevCurrentBid.current = vehicle.current_bid;
		if (prev === null || vehicle.current_bid === null) return;
		if (vehicle.current_bid === prev) return;
		setPriceFlash(true);
		const timer = window.setTimeout(() => {
			setPriceFlash(false);
		}, PRICE_FLASH_MS);
		return () => {
			window.clearTimeout(timer);
		};
	}, [vehicle.current_bid]);

	const reserve = getReserveLabel(vehicle);
	const displayPrice = getDisplayPrice(vehicle);
	const hasCurrentBid = vehicle.current_bid !== null;

	// Strict integer parse — rejects "150.5", "1e3", "abc", "" → NaN.
	const parsedAmount = /^\d+$/.test(amount.trim())
		? Number(amount)
		: Number.NaN;
	const isValidNumber = Number.isInteger(parsedAmount);
	const amountBelowMin = isValidNumber && parsedAmount < minBid;
	const safeAmount = isValidNumber ? parsedAmount : minBid;
	const showInvalid =
		amount.trim() !== "" && (!isValidNumber || amountBelowMin);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!isValidNumber || parsedAmount < minBid) return;
		void submit(parsedAmount);
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
	// Buy Now never moves the price backwards: if a bid has already exceeded
	// buy_now_price, the user pays current_bid + increment instead.
	const buyNowAmount =
		vehicle.buy_now_price !== null
			? Math.max(vehicle.buy_now_price, minBid)
			: 0;

	const countdownLabel =
		auctionState.status === "upcoming"
			? `Starts in ${formatTimeRemaining(auctionState.timeRemaining)}`
			: auctionState.status === "live"
				? `Ends in ${formatTimeRemaining(auctionState.timeRemaining)}`
				: "Ended";

	return (
		<aside
			aria-label="Bidding"
			className="rounded-lg border border-border bg-surface p-6"
		>
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
				<p
					className={cn(
						"font-mono text-3xl font-semibold text-accent",
						priceFlash && "flash-accent",
					)}
				>
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

			{lastAction === "buy_now" && lastBid ? (
				<div
					role="status"
					className="rounded-lg border border-success/30 bg-success/10 p-4 text-center"
				>
					<CheckCircle
						aria-hidden="true"
						className="mx-auto mb-2 size-10 text-success bid-success-in"
					/>
					<p className="text-sm font-medium uppercase tracking-wider text-success">
						Sold to you
					</p>
					<p className="mt-1 font-mono text-2xl font-semibold text-text-primary">
						{formatCurrency(lastBid.amount)}
					</p>
					<p className="mt-2 text-xs text-text-muted">
						You bought this vehicle. The auction is closed.
					</p>
				</div>
			) : showBidControls ? (
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
							aria-invalid={showInvalid ? "true" : undefined}
							aria-describedby="bid-amount-hint"
							onChange={(e) => {
								setAmount(e.target.value);
							}}
							className={cn(
								"w-full rounded-lg border bg-page px-3 py-2.5 font-mono text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500",
								showInvalid ? "border-error" : "border-border",
							)}
						/>
						<p
							id="bid-amount-hint"
							className={cn(
								"mt-1 text-xs",
								showInvalid ? "text-error" : "text-text-muted",
							)}
						>
							{showInvalid && !isValidNumber
								? "Enter a whole dollar amount."
								: `Minimum: ${formatCurrency(minBid)}`}
						</p>
					</div>

					{error ? (
						<p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
							{errorMessage(error)}
						</p>
					) : null}
					{lastBid && lastAction === "bid" ? (
						<div
							role="status"
							className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success"
						>
							<CheckCircle
								aria-hidden="true"
								className="size-5 shrink-0 bid-success-in"
							/>
							<span>Bid placed!</span>
						</div>
					) : null}

					<button
						type="submit"
						disabled={isPending}
						aria-label={`Place a bid on ${String(vehicle.year)} ${vehicle.make} ${vehicle.model}`}
						className="w-full min-h-11 rounded-lg bg-accent py-2.5 font-medium text-page transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
					>
						{isPending
							? "Placing bid…"
							: `Place Bid — ${formatCurrency(safeAmount)}`}
					</button>

					{showBuyNow ? (
						<button
							type="button"
							onClick={handleBuyNow}
							disabled={isPending}
							aria-label={`Buy now for ${formatCurrency(buyNowAmount)}`}
							className="w-full min-h-11 rounded-lg border border-accent py-2.5 font-medium text-accent transition-all hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
						>
							Buy Now — {formatCurrency(buyNowAmount)}
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
