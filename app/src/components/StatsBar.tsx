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
		<div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs text-text-secondary">
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
			className="inline-flex items-center gap-1.5 whitespace-nowrap"
		>
			{pulse ? (
				<span
					aria-hidden="true"
					className="size-1.5 rounded-full bg-success animate-pulse"
				/>
			) : null}
			<span className="text-text-muted">{label}</span>
			<span className="font-mono font-semibold text-text-primary">{value}</span>
		</div>
	);
}
