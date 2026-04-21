import { AlertCircle } from "lucide-react";
import { MotionConfig } from "motion/react";
import {
	createBrowserRouter,
	Link,
	Outlet,
	RouterProvider,
	ScrollRestoration,
	useLocation,
	useRouteError,
} from "react-router";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import { InventoryPage } from "./pages/InventoryPage";

function RootLayout() {
	const location = useLocation();
	const theme = useTheme();
	return (
		<ThemeProvider value={theme}>
			<MotionConfig reducedMotion="user">
				<ScrollRestoration />
				<ErrorBoundary key={location.pathname}>
					<Outlet />
				</ErrorBoundary>
			</MotionConfig>
		</ThemeProvider>
	);
}

// Detect chunk-load errors across browsers — Chrome/Firefox, Safari, and
// Webpack-style all throw different strings. The Reload CTA only makes sense
// when the HTML is stale relative to the chunks; every other error routes home.
function isChunkLoadError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	if (error.name === "ChunkLoadError") return true;
	const msg = error.message.toLowerCase();
	return (
		msg.includes("dynamically imported module") || // Chrome, Firefox
		msg.includes("importing a module script") || // Safari
		msg.includes("loading chunk") // Webpack / legacy
	);
}

// Handles navigation-layer errors — loader failures, chunk-load rejections after
// a deploy swaps chunk hashes, etc.
function RouteErrorElement() {
	const error = useRouteError();
	const isChunkError = isChunkLoadError(error);

	return (
		<div className="bg-page-gradient flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
			<AlertCircle aria-hidden="true" className="mb-4 size-12 text-error" />
			<h1 className="font-heading text-xl font-semibold text-text-primary">
				{isChunkError ? "This page needs to reload" : "Something went wrong"}
			</h1>
			<p className="mt-2 max-w-md text-sm text-text-secondary">
				{isChunkError
					? "A newer version of the app is available. Reload to pick it up."
					: "An unexpected error occurred. Please try again."}
			</p>
			{isChunkError ? (
				<button
					type="button"
					onClick={() => {
						window.location.reload();
					}}
					className="bg-accent-gradient mt-6 inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
				>
					Reload
				</button>
			) : (
				<Link
					to="/"
					className="bg-accent-gradient mt-6 inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
				>
					Browse all vehicles
				</Link>
			)}
		</div>
	);
}

// Renders during the router's initial-hydration window. In this no-loader SPA
// it's essentially instant, but RR v7 warns if routes use `lazy` without one.
// Keep it empty — lazy nav uses the previous view as its own fallback.
function RouteHydrateFallback() {
	return null;
}

const router = createBrowserRouter([
	{
		Component: RootLayout,
		ErrorBoundary: RouteErrorElement,
		HydrateFallback: RouteHydrateFallback,
		children: [
			{ path: "/", Component: InventoryPage },
			// Non-landing routes are lazy-loaded so inventory's initial chunk
			// doesn't carry the detail page's BidPanel/ImageGallery/SpecsPanel
			// or the 404 surface. React Router v7 handles the split + preload.
			{
				path: "/vehicles/:id",
				lazy: async () => {
					const { VehiclePage } = await import("./pages/VehiclePage");
					return { Component: VehiclePage };
				},
			},
			{
				path: "*",
				lazy: async () => {
					const { NotFoundPage } = await import("./pages/NotFoundPage");
					return { Component: NotFoundPage };
				},
			},
		],
	},
]);

export function App() {
	return <RouterProvider router={router} />;
}
