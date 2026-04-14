import { useCallback, useState } from "react";
import {
	getAuctionStatus,
	getMinimumBid,
	parseAuctionStart,
} from "../lib/auction";
import * as dataStore from "../lib/dataStore";
import type { Bid, BidError } from "../types";

export function useBid(vehicleId: string): {
	submit: (amount: number) => Promise<void>;
	buyNow: () => Promise<void>;
	isPending: boolean;
	error: BidError | null;
	lastBid: Bid | null;
} {
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<BidError | null>(null);
	const [lastBid, setLastBid] = useState<Bid | null>(null);

	const submit = useCallback(
		async (amount: number) => {
			setError(null);

			// Read fresh vehicle data at submission time — not from a stale closure
			const vehicle = dataStore.getVehicle(vehicleId);
			if (!vehicle) {
				setError({
					type: "network",
					message: "Vehicle not found.",
				});
				return;
			}

			const { status } = getAuctionStatus(
				parseAuctionStart(vehicle.auction_start),
				Date.now(),
			);

			if (status !== "live") {
				setError({
					type: "auction_ended",
					message: "This auction has ended — your bid couldn't be placed.",
				});
				return;
			}

			const minimum = getMinimumBid(vehicle);

			if (amount < minimum) {
				setError({
					type: "bid_too_low",
					minimum,
					message: `Bid must be at least $${minimum.toLocaleString()}.`,
				});
				return;
			}

			setIsPending(true);

			try {
				const result = await dataStore.submitBid(vehicleId, amount);
				if (result.success) {
					setLastBid(result.bid);
					setError(null);
				} else {
					setError(result.error);
				}
			} finally {
				setIsPending(false);
			}
		},
		[vehicleId],
	);

	const buyNow = useCallback(async () => {
		setError(null);

		const vehicle = dataStore.getVehicle(vehicleId);
		if (!vehicle || vehicle.buy_now_price === null) return;

		const { status } = getAuctionStatus(
			parseAuctionStart(vehicle.auction_start),
			Date.now(),
		);

		if (status !== "live") {
			setError({
				type: "auction_ended",
				message: "This auction has ended — Buy Now is no longer available.",
			});
			return;
		}

		setIsPending(true);

		try {
			const result = await dataStore.submitBid(
				vehicleId,
				vehicle.buy_now_price,
			);
			if (result.success) {
				setLastBid(result.bid);
				setError(null);
			} else {
				setError(result.error);
			}
		} finally {
			setIsPending(false);
		}
	}, [vehicleId]);

	return { submit, buyNow, isPending, error, lastBid };
}
