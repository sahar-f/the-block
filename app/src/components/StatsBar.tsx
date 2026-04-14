import { useMemo } from "react";
import { getAuctionStatus, parseAuctionStart } from "../lib/auction";
import { ENDING_SOON_MS } from "../lib/constants";
import { formatCurrency, getDisplayPrice } from "../lib/format";
import type { Vehicle } from "../types";

type StatsBarProps = {
	vehicles: Vehicle[];
	now: number;
};

export function StatsBar({ vehicles, now }: StatsBarProps) {
	const stats = useMemo(() => {
		let liveCount = 0;
		let endingSoonCount = 0;
		let totalValue = 0;

		for (const v of vehicles) {
			const { status, timeRemaining } = getAuctionStatus(
				parseAuctionStart(v.auction_start),
				now,
			);
			totalValue += getDisplayPrice(v);
			if (status === "live") {
				liveCount++;
				if (timeRemaining < ENDING_SOON_MS) endingSoonCount++;
			}
		}

		return {
			total: vehicles.length,
			liveCount,
			endingSoonCount,
			totalValue,
		};
	}, [vehicles, now]);

	return (
		<div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-0 sm:divide-x sm:divide-border/50">
			<Stat label="Vehicles" value={String(stats.total)} />
			<Stat label="Live" value={String(stats.liveCount)} pulse />
			<Stat label="Ending Soon" value={String(stats.endingSoonCount)} />
			<Stat label="Total Value" value={formatCurrency(stats.totalValue)} />
		</div>
	);
}

type StatProps = {
	label: string;
	value: string;
	pulse?: boolean;
};

function Stat({ label, value, pulse }: StatProps) {
	return (
		<div
			data-stat={label}
			className="flex items-center gap-2 sm:px-4 sm:first:pl-0 sm:last:pr-0"
		>
			{pulse ? (
				<span
					aria-hidden="true"
					className="size-2 rounded-full bg-success animate-pulse"
				/>
			) : null}
			<span className="font-semibold text-text-primary">{value}</span>
			<span className="text-sm text-text-secondary">{label}</span>
		</div>
	);
}
