import { Link } from "react-router";

export function NotFoundPage() {
	return (
		<div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
			<h1 className="font-heading text-4xl font-semibold">404</h1>
			<p className="mt-2 text-text-secondary">Page not found</p>
			<Link
				to="/"
				className="mt-6 rounded-lg bg-accent px-4 py-2 font-medium text-page transition-all hover:bg-accent-hover focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-page focus:outline-none"
			>
				Browse all vehicles
			</Link>
		</div>
	);
}
