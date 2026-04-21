import { useEffect } from "react";
import { Link } from "react-router";

export function NotFoundPage() {
	useEffect(() => {
		document.title = "The Block | Not Found";
	}, []);

	return (
		<div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
			<h1 className="font-heading text-4xl font-semibold">404</h1>
			<p className="mt-2 text-text-secondary">Page not found</p>
			<Link
				to="/"
				className="bg-accent-gradient mt-6 inline-flex min-h-11 items-center rounded-xl px-4 py-2 font-medium text-white shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
			>
				Browse all vehicles
			</Link>
		</div>
	);
}
