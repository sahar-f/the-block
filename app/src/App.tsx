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
			{/* Key on pathname so an error on one route doesn't strand the user
			    on the fallback after they navigate away. */}
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
