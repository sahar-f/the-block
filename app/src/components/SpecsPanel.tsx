import { Calendar, Fuel, Gauge, Zap } from "lucide-react";
import { cn } from "../lib/cn";
import { formatOdometer } from "../lib/format";
import type { Vehicle } from "../types";

type SpecsPanelProps = {
	vehicle: Vehicle;
};

type SpecRow = { label: string; value: string; mono?: boolean };

function titleCase(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export function SpecsPanel({ vehicle }: SpecsPanelProps) {
	// Year / Odometer / Fuel Type / Transmission live in the 4-up row only —
	// promoting them here avoids duplication.
	const rows: SpecRow[] = [
		{ label: "VIN", value: vehicle.vin, mono: true },
		{ label: "Body Style", value: vehicle.body_style },
		{ label: "Engine", value: vehicle.engine },
		{ label: "Drivetrain", value: vehicle.drivetrain },
		{ label: "Title", value: titleCase(vehicle.title_status) },
		{ label: "Exterior", value: vehicle.exterior_color },
		{ label: "Interior", value: vehicle.interior_color },
	];

	return (
		<section className="rounded-2xl border border-border bg-surface-subtle p-6">
			<h2 className="mb-5 font-heading text-xl font-semibold text-text-primary">
				Specifications
			</h2>

			<div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
				<QuickSpec
					icon={<Calendar className="size-5 text-accent" />}
					label="Year"
					value={String(vehicle.year)}
				/>
				<QuickSpec
					icon={<Gauge className="size-5 text-accent" />}
					label="Odometer"
					value={formatOdometer(vehicle.odometer_km)}
				/>
				<QuickSpec
					icon={<Fuel className="size-5 text-accent" />}
					label="Fuel"
					value={vehicle.fuel_type}
				/>
				<QuickSpec
					icon={<Zap className="size-5 text-accent" />}
					label="Transmission"
					value={vehicle.transmission}
				/>
			</div>

			<dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
				{rows.map((row) => (
					<div key={row.label} className="flex flex-col gap-0.5">
						<dt className="text-xs uppercase tracking-wider text-text-muted">
							{row.label}
						</dt>
						<dd
							className={cn(
								"text-sm text-text-primary",
								row.mono && "font-mono",
							)}
						>
							{row.value}
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

function QuickSpec({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 to-accent-to/10 p-4">
			<div className="mb-2">{icon}</div>
			<p className="text-xs uppercase tracking-wider text-text-muted">
				{label}
			</p>
			<p className="mt-0.5 text-lg font-bold text-text-primary">{value}</p>
		</div>
	);
}
