import { AlertCircle, ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { BidPanel } from "../components/BidPanel";
import { ConditionPanel } from "../components/ConditionPanel";
import { ImageGallery } from "../components/ImageGallery";
import { DetailSkeleton } from "../components/Skeleton";
import { SpecsPanel } from "../components/SpecsPanel";
import { useNow } from "../hooks/useNow";
import { useVehicle } from "../hooks/useVehicle";
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
			<div className="bg-page-atmosphere">
				<div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10 xl:px-12">
					<DetailSkeleton />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-10 xl:px-12">
				<AlertCircle className="mb-4 size-12 text-error" />
				<h2 className="font-heading text-xl font-semibold text-text-primary">
					Something went wrong
				</h2>
				<p className="mt-2 text-sm text-text-secondary">{error}</p>
				<Link
					to="/"
					className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-page transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
				>
					Back to Inventory
				</Link>
			</div>
		);
	}

	if (!vehicle) {
		return <NotFoundPage />;
	}

	return (
		<div className="bg-page-atmosphere pb-24 lg:pb-8">
			<div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10 xl:px-12">
				<Link
					to="/"
					className="mb-4 inline-flex items-center gap-1 rounded text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
				>
					<ChevronLeft className="size-4" aria-hidden="true" />
					Back to Inventory
				</Link>

				<header className="mb-6">
					<h1 className="font-heading text-2xl font-semibold text-text-primary sm:text-3xl">
						{vehicle.year} {vehicle.make} {vehicle.model}{" "}
						<span className="font-normal text-text-secondary">
							{vehicle.trim}
						</span>
					</h1>
					<p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-text-muted">
						<span>Lot {vehicle.lot}</span>
						<span aria-hidden="true" className="text-border-hover">
							•
						</span>
						<span>VIN {vehicle.vin}</span>
						<span aria-hidden="true" className="text-border-hover">
							•
						</span>
						<span>
							{vehicle.city}, {vehicle.province}
						</span>
						<span aria-hidden="true" className="text-border-hover">
							•
						</span>
						<span>{vehicle.selling_dealership}</span>
					</p>
				</header>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					<div className="space-y-6 lg:col-span-7">
						<ImageGallery vehicle={vehicle} />
						<SpecsPanel vehicle={vehicle} />
						<ConditionPanel
							grade={vehicle.condition_grade}
							report={vehicle.condition_report}
							damageNotes={vehicle.damage_notes}
						/>
					</div>
					<div className="lg:col-span-5">
						<div className="sticky bottom-0 left-0 right-0 z-10 -mx-4 border-t border-border bg-page/95 p-4 backdrop-blur-sm sm:-mx-6 lg:static lg:top-8 lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-0">
							<BidPanel vehicle={vehicle} now={now} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
