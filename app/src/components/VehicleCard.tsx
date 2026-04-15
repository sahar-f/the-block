import { Car } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { getAuctionStatus, parseAuctionStart } from "../lib/auction";
import {
	formatCurrency,
	formatTimeRemaining,
	getDisplayPrice,
	getVehicleImageUrl,
} from "../lib/format";
import type { Vehicle } from "../types";
import { AuctionBadge } from "./AuctionBadge";
import { ConditionBadge } from "./ConditionBadge";

const CARD_STAGGER_MS = 30;
const CARD_STAGGER_MAX_MS = 270;

type VehicleCardProps = {
	vehicle: Vehicle;
	index: number;
	now: number;
};

export function VehicleCard({ vehicle, index, now }: VehicleCardProps) {
	const [imgError, setImgError] = useState(false);
	const auctionState = getAuctionStatus(
		parseAuctionStart(vehicle.auction_start),
		now,
	);

	const price = getDisplayPrice(vehicle);
	const hasCurrentBid = vehicle.current_bid !== null;
	const imgSrc = getVehicleImageUrl(vehicle);
	const altText = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

	return (
		<Link
			to={`/vehicles/${vehicle.id}`}
			className="group rounded-lg border border-border bg-surface overflow-hidden transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/5 hover:border-border-hover focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:outline-none motion-safe:animate-[card-enter_0.3s_ease-out_both]"
			style={{
				animationDelay: `${String(Math.min(index * CARD_STAGGER_MS, CARD_STAGGER_MAX_MS))}ms`,
				contentVisibility: "auto",
				containIntrinsicSize: "0 420px",
			}}
		>
			<div className="relative aspect-[4/3] overflow-hidden bg-surface">
				{imgError ? (
					<div className="flex size-full flex-col items-center justify-center gap-2 bg-surface">
						<Car className="size-12 text-border-hover" />
						<span className="text-xs text-text-muted">{altText}</span>
					</div>
				) : (
					<img
						src={imgSrc}
						alt={altText}
						loading="lazy"
						onError={() => {
							setImgError(true);
						}}
						className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
					/>
				)}
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
				<span className="absolute top-2 left-2 rounded bg-page/80 px-1.5 py-0.5 text-xs font-mono text-text-secondary backdrop-blur-sm">
					{vehicle.lot}
				</span>
				<div className="absolute top-2 right-2 rounded-full bg-page/70 px-2 py-1 backdrop-blur-sm">
					<AuctionBadge status={auctionState.status} />
				</div>
			</div>

			<div className="p-4 space-y-2">
				<h3 className="font-heading text-base font-semibold text-text-primary truncate">
					{vehicle.year} {vehicle.make} {vehicle.model}{" "}
					<span className="font-normal text-text-secondary">
						{vehicle.trim}
					</span>
				</h3>

				<div className="flex items-baseline justify-between">
					<div>
						{!hasCurrentBid ? (
							<p className="text-[10px] uppercase tracking-wider text-text-muted">
								Starting bid
							</p>
						) : null}
						<p className="font-mono text-xl font-semibold text-accent">
							{formatCurrency(price)}
						</p>
					</div>
					<span className="text-sm text-text-muted">
						{vehicle.bid_count} bid{vehicle.bid_count !== 1 ? "s" : ""}
					</span>
				</div>

				<div className="flex items-center justify-between">
					<ConditionBadge grade={vehicle.condition_grade} />
					{auctionState.status === "live" ? (
						<span className="font-mono text-xs text-text-muted">
							{formatTimeRemaining(auctionState.timeRemaining)}
						</span>
					) : null}
				</div>

				<p className="text-xs text-text-muted truncate">
					{vehicle.city}, {vehicle.province} · {vehicle.selling_dealership}
				</p>
			</div>
		</Link>
	);
}
