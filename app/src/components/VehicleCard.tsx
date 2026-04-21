import {
	ArrowRight,
	Calendar,
	Car,
	Clock,
	Gauge,
	Sparkles,
	Star,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";
import { getAuctionStatus, parseAuctionStart } from "../lib/auction";
import { FEATURED_CONDITION_THRESHOLD } from "../lib/constants";
import {
	formatCurrency,
	formatTimeRemaining,
	getDisplayPrice,
	getVehicleImageUrl,
} from "../lib/format";
import type { Vehicle } from "../types";
import { AuctionBadge } from "./AuctionBadge";

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
	const altText = `${String(vehicle.year)} ${vehicle.make} ${vehicle.model}`;
	const isFeatured =
		vehicle.condition_grade >= FEATURED_CONDITION_THRESHOLD &&
		auctionState.status === "live";

	const statusLabel =
		auctionState.status === "live"
			? formatTimeRemaining(auctionState.timeRemaining)
			: auctionState.status === "upcoming"
				? "Upcoming"
				: "Ended";

	return (
		<Link
			to={`/vehicles/${vehicle.id}`}
			className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
			style={{
				contentVisibility: "auto",
				containIntrinsicSize: "0 480px",
			}}
		>
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					delay: Math.min(index * 0.04, 0.3),
					duration: 0.35,
					ease: "easeOut",
				}}
				whileHover={{ y: -8 }}
				className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-lg transition-shadow duration-500 hover:shadow-2xl"
			>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 to-accent-to/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

				{isFeatured ? (
					<span className="bg-accent-gradient absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
						<Sparkles className="size-3.5 animate-pulse" />
						Featured
					</span>
				) : null}

				<div className="relative h-72 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
					{imgError ? (
						<div className="flex size-full flex-col items-center justify-center gap-2">
							<Car className="size-10 text-text-muted" />
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
							className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
						/>
					)}
					<span
						className={
							isFeatured
								? "absolute bottom-3 left-3 rounded bg-black/60 px-1.5 py-0.5 font-mono text-xs text-white backdrop-blur-sm"
								: "absolute left-3 top-3 rounded bg-black/60 px-1.5 py-0.5 font-mono text-xs text-white backdrop-blur-sm"
						}
					>
						{vehicle.lot}
					</span>
					<div className="absolute right-3 top-3 rounded-full bg-surface/80 px-2 py-1 backdrop-blur-sm">
						<AuctionBadge status={auctionState.status} />
					</div>
				</div>

				<div className="relative flex flex-1 flex-col gap-5 p-6">
					<div>
						<h3 className="line-clamp-2 min-h-[3.5rem] font-heading text-xl font-semibold text-text-primary transition-colors group-hover:text-accent">
							{vehicle.year} {vehicle.make} {vehicle.model}{" "}
							<span className="font-normal text-text-secondary">
								{vehicle.trim}
							</span>
						</h3>
						<p className="mt-1 text-xs uppercase tracking-wider text-text-muted">
							{hasCurrentBid ? "Current bid" : "Starting bid"}
						</p>
						<p className="text-accent-gradient font-mono text-3xl font-bold">
							{formatCurrency(price)}
						</p>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<SpecCell
							icon={<Calendar className="size-4 text-accent" />}
							value={String(vehicle.year)}
						/>
						<SpecCell
							icon={<Gauge className="size-4 text-accent" />}
							value={`${vehicle.odometer_km.toLocaleString()} km`}
						/>
						<SpecCell
							icon={<Star className="size-4 text-accent" />}
							value={vehicle.condition_grade.toFixed(1)}
						/>
						<SpecCell
							icon={<Clock className="size-4 text-accent" />}
							value={statusLabel}
						/>
					</div>

					<div className="mt-auto space-y-3">
						<div className="flex flex-wrap items-center gap-x-2 text-xs text-text-muted">
							<span>
								{vehicle.bid_count} bid{vehicle.bid_count !== 1 ? "s" : ""}
							</span>
							<span aria-hidden="true">·</span>
							<span>
								{vehicle.city}, {vehicle.province}
							</span>
							<span aria-hidden="true">·</span>
							<span className="truncate">{vehicle.selling_dealership}</span>
						</div>
						<div className="flex items-center justify-end text-sm font-medium text-accent transition-transform group-hover:translate-x-1">
							View details <ArrowRight className="ml-1 size-4" />
						</div>
					</div>
				</div>
			</motion.div>
		</Link>
	);
}

function SpecCell({ icon, value }: { icon: React.ReactNode; value: string }) {
	return (
		<div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/10 to-accent-to/10 px-3 py-2 text-sm text-text-secondary">
			{icon}
			<span className="font-medium text-text-primary">{value}</span>
		</div>
	);
}
