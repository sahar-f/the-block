import {
	AlertCircle,
	Award,
	ChevronLeft,
	MapPin,
	Shield,
	Store,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { BidPanel } from "../components/BidPanel";
import { ConditionPanel } from "../components/ConditionPanel";
import { ConditionSummary } from "../components/ConditionSummary";
import { ImageGallery } from "../components/ImageGallery";
import { SiteHeader } from "../components/SiteHeader";
import { DetailSkeleton } from "../components/Skeleton";
import { SpecsPanel } from "../components/SpecsPanel";
import { useNow } from "../hooks/useNow";
import { useVehicle } from "../hooks/useVehicle";
import { formatCurrency, getDisplayPrice } from "../lib/format";
import type { Vehicle } from "../types";
import { NotFoundPage } from "./NotFoundPage";

export function VehiclePage() {
	const { id } = useParams<{ id: string }>();
	const { data: vehicle, isLoading, error } = useVehicle(id ?? "");
	const now = useNow();

	useEffect(() => {
		if (vehicle) {
			document.title = `The Block | ${String(vehicle.year)} ${vehicle.make} ${vehicle.model}`;
		}
		return () => {
			document.title = "The Block | Inventory";
		};
	}, [vehicle]);

	if (isLoading) {
		return (
			<>
				<SiteHeader />
				<main className="bg-page-gradient min-h-screen">
					<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
						<DetailSkeleton />
					</div>
				</main>
			</>
		);
	}

	if (error) {
		return (
			<>
				<SiteHeader />
				<main className="bg-page-gradient min-h-screen">
					<div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
						<AlertCircle className="mb-4 size-12 text-error" />
						<h2 className="font-heading text-xl font-semibold text-text-primary">
							Something went wrong
						</h2>
						<p className="mt-2 text-sm text-text-secondary">{error}</p>
						<Link
							to="/"
							className="bg-accent-gradient mt-6 inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
						>
							Back to Inventory
						</Link>
					</div>
				</main>
			</>
		);
	}

	if (!vehicle) {
		return <NotFoundPage />;
	}

	return (
		<>
			<SiteHeader />
			<main className="bg-page-gradient pb-24 lg:pb-12">
				<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<Link
						to="/"
						className="mb-6 inline-flex items-center gap-1 rounded text-sm font-medium text-text-secondary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
					>
						<ChevronLeft className="size-4" aria-hidden="true" />
						Back to Inventory
					</Link>

					<article className="overflow-hidden rounded-3xl bg-surface shadow-2xl">
						<header className="border-b border-border p-6 md:p-8">
							<h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
								{vehicle.year} {vehicle.make} {vehicle.model}{" "}
								<span className="font-normal text-text-secondary">
									{vehicle.trim}
								</span>
							</h1>
							<p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-text-muted">
								<span>Lot {vehicle.lot}</span>
								<span aria-hidden="true">•</span>
								<span>VIN {vehicle.vin}</span>
								<span aria-hidden="true">•</span>
								<span>
									{vehicle.city}, {vehicle.province}
								</span>
							</p>
						</header>

						<div className="grid grid-cols-1 gap-8 p-6 md:p-8 lg:grid-cols-3">
							<div className="space-y-6 lg:col-span-2">
								<ImageGallery vehicle={vehicle} />
								<ConditionSummary vehicle={vehicle} />
								<SpecsPanel vehicle={vehicle} />
								<ConditionPanel
									grade={vehicle.condition_grade}
									report={vehicle.condition_report}
									damageNotes={vehicle.damage_notes}
								/>
							</div>

							<aside className="lg:col-span-1">
								<div className="space-y-6 lg:sticky lg:top-24">
									<BidPanel vehicle={vehicle} now={now} />
									<TrustStrip vehicle={vehicle} />
									<SoldByCard vehicle={vehicle} />
								</div>
							</aside>
						</div>
					</article>
				</div>

				{/* Mobile sticky CTA — scrolls to #bid-panel for fast bid action on small screens. */}
				<div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
					<div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
						<div>
							<p className="text-[10px] uppercase tracking-wider text-text-muted">
								Current bid
							</p>
							<p className="text-accent-gradient font-mono text-lg font-bold">
								{formatCurrency(getDisplayPrice(vehicle))}
							</p>
						</div>
						<a
							href="#bid-panel"
							className="bg-accent-gradient inline-flex items-center rounded-xl px-6 py-3 font-semibold text-white shadow-lg"
						>
							Place Bid
						</a>
					</div>
				</div>
			</main>
		</>
	);
}

function TrustStrip({ vehicle }: { vehicle: Vehicle }) {
	const titleLabel =
		vehicle.title_status.charAt(0).toUpperCase() +
		vehicle.title_status.slice(1);
	return (
		<section className="space-y-4 rounded-2xl border border-border bg-surface-subtle p-4">
			<div className="flex items-center gap-3">
				<span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent/10">
					<Shield className="size-5 text-accent" aria-hidden="true" />
				</span>
				<div>
					<p className="font-semibold text-text-primary">{titleLabel} Title</p>
					<p className="text-xs text-text-secondary">Verified at intake</p>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent/10">
					<Award className="size-5 text-accent" aria-hidden="true" />
				</span>
				<div>
					<p className="font-semibold text-text-primary">
						Condition {vehicle.condition_grade.toFixed(1)} / 5
					</p>
					<p className="text-xs text-text-secondary">Dealer-reported grade</p>
				</div>
			</div>
		</section>
	);
}

function SoldByCard({ vehicle }: { vehicle: Vehicle }) {
	return (
		<section className="space-y-2 rounded-2xl border border-border bg-surface-subtle p-4">
			<h3 className="font-heading text-sm font-semibold text-text-primary">
				Sold by
			</h3>
			<div className="flex items-center gap-2 text-sm text-text-secondary">
				<Store className="size-4 text-accent" aria-hidden="true" />
				<span>{vehicle.selling_dealership}</span>
			</div>
			<div className="flex items-center gap-2 text-sm text-text-secondary">
				<MapPin className="size-4 text-accent" aria-hidden="true" />
				<span>
					{vehicle.city}, {vehicle.province}
				</span>
			</div>
		</section>
	);
}
