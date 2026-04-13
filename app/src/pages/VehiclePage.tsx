import { useParams } from "react-router";

export function VehiclePage() {
	const { id } = useParams<{ id: string }>();

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<h1 className="font-heading text-3xl font-semibold">Vehicle {id}</h1>
		</div>
	);
}
