import {
	createBrowserRouter,
	Outlet,
	RouterProvider,
	ScrollRestoration,
} from "react-router";
import { InventoryPage } from "./pages/InventoryPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { VehiclePage } from "./pages/VehiclePage";

function RootLayout() {
	return (
		<>
			<ScrollRestoration />
			<Outlet />
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
