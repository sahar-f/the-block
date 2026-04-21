import { Flame } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { getAuctionStatus, parseAuctionStart } from "../lib/auction";
import {
	formatCurrency,
	formatTimeRemaining,
	getDisplayPrice,
	getVehicleImageUrl,
} from "../lib/format";
import type { Vehicle } from "../types";

const MAX_ENDING_SOON = 5;

type EndingSoonStripProps = {
	vehicles: Vehicle[];
	now: number;
};

export function EndingSoonStrip({ vehicles, now }: EndingSoonStripProps) {
	const endingSoon = useMemo(() => {
		const live: { vehicle: Vehicle; timeRemaining: number }[] = [];

		for (const v of vehicles) {
			const state = getAuctionStatus(parseAuctionStart(v.auction_start), now);
			if (state.status === "live") {
				live.push({ vehicle: v, timeRemaining: state.timeRemaining });
			}
		}

		return live
			.sort((a, b) => a.timeRemaining - b.timeRemaining)
			.slice(0, MAX_ENDING_SOON);
	}, [vehicles, now]);

	if (endingSoon.length === 0) return null;

	return (
		<section className="rounded-3xl border border-border bg-surface p-6">
			<h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-text-primary">
				<Flame aria-hidden="true" className="size-5 text-accent" />
				Ending Soon
			</h2>
			<div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{endingSoon.map(({ vehicle, timeRemaining }) => (
					<Link
						key={vehicle.id}
						to={`/vehicles/${vehicle.id}`}
						className="flex min-w-[220px] snap-start items-center gap-3 rounded-2xl border border-border bg-surface-subtle p-3 transition-colors hover:border-accent/40 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:outline-none"
					>
						<img
							src={getVehicleImageUrl(vehicle)}
							alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
							loading="lazy"
							className="size-14 shrink-0 rounded-xl object-cover"
						/>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-text-primary">
								{vehicle.year} {vehicle.make} {vehicle.model}
							</p>
							<p className="text-accent-gradient font-mono text-sm font-semibold">
								{formatCurrency(getDisplayPrice(vehicle))}
							</p>
							<p className="font-mono text-xs text-text-muted">
								{formatTimeRemaining(timeRemaining)}
							</p>
						</div>
					</Link>
				))}
			</div>
		</section>
	);
}
