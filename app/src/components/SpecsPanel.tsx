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
	const rows: SpecRow[] = [
		{ label: "VIN", value: vehicle.vin, mono: true },
		{ label: "Body Style", value: vehicle.body_style },
		{ label: "Engine", value: vehicle.engine },
		{ label: "Transmission", value: vehicle.transmission },
		{ label: "Drivetrain", value: vehicle.drivetrain },
		{ label: "Fuel Type", value: vehicle.fuel_type },
		{ label: "Odometer", value: formatOdometer(vehicle.odometer_km) },
		{ label: "Title", value: titleCase(vehicle.title_status) },
		{ label: "Exterior", value: vehicle.exterior_color },
		{ label: "Interior", value: vehicle.interior_color },
	];

	return (
		<section className="rounded-lg border border-border bg-surface p-6">
			<h2 className="mb-4 font-heading text-xl font-semibold text-text-primary">
				Specifications
			</h2>
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
