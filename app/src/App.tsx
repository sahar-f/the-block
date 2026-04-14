import {
	createBrowserRouter,
	Outlet,
	RouterProvider,
	ScrollRestoration,
	useLocation,
} from "react-router";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { InventoryPage } from "./pages/InventoryPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { VehiclePage } from "./pages/VehiclePage";

function RootLayout() {
	const location = useLocation();
	return (
		<>
			<ScrollRestoration />
			{/* Keying ErrorBoundary on pathname resets hasError on navigation,
			    so a user hitting an error on one route isn't stuck on the
			    fallback after navigating to another. */}
			<ErrorBoundary key={location.pathname}>
				<Outlet />
			</ErrorBoundary>
		</>
	);
}

const router = createBrowserRouter([
	{
		Component: RootLayout,
		children: [
			{
				path: "/",
				Component: InventoryPage,
			},
			{
				path: "/vehicles/:id",
				Component: VehiclePage,
			},
			{
				path: "*",
				Component: NotFoundPage,
			},
		],
	},
]);

export function App() {
	return <RouterProvider router={router} />;
}
