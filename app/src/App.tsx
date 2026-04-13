import { createBrowserRouter, RouterProvider } from "react-router";
import { InventoryPage } from "./pages/InventoryPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { VehiclePage } from "./pages/VehiclePage";

const router = createBrowserRouter([
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
]);

export function App() {
	return <RouterProvider router={router} />;
}
