import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Vehicle } from "../types";
import { ImageGallery } from "./ImageGallery";

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
	return {
		id: "v1",
		vin: "VIN123",
		year: 2024,
		make: "Toyota",
		model: "Camry",
		trim: "SE",
		body_style: "sedan",
		exterior_color: "White",
		interior_color: "Black",
		engine: "2.5L",
		transmission: "automatic",
		drivetrain: "FWD",
		odometer_km: 10000,
		fuel_type: "gasoline",
		condition_grade: 4.0,
		condition_report: "Good",
		damage_notes: [],
		title_status: "clean",
		province: "Ontario",
		city: "Toronto",
		auction_start: new Date().toISOString(),
		starting_bid: 10000,
		reserve_price: null,
		buy_now_price: null,
		images: ["a.jpg", "b.jpg", "c.jpg"],
		selling_dealership: "Dealer",
		lot: "A-0001",
		current_bid: null,
		bid_count: 0,
		...overrides,
	};
}

describe("ImageGallery", () => {
	it("renders main image slots + thumbnail buttons for each image in images[]", () => {
		render(<ImageGallery vehicle={makeVehicle()} />);
		// 3 main image slots with descriptive alt text
		const mainImgs = screen.getAllByAltText(/— \d+ of \d+/);
		expect(mainImgs.length).toBe(3);
		// 3 thumbnail buttons
		const thumbButtons = screen.getAllByRole("button", {
			name: /view photo \d+/i,
		});
		expect(thumbButtons.length).toBe(3);
	});

	it("renders descriptive alt text for main image", () => {
		const v = makeVehicle({ year: 2024, make: "Toyota", model: "Camry" });
		render(<ImageGallery vehicle={v} />);
		expect(
			screen.getByAltText("2024 Toyota Camry — 1 of 3"),
		).toBeInTheDocument();
	});

	it("clicking a thumbnail updates the active image (photo 3)", () => {
		render(<ImageGallery vehicle={makeVehicle()} />);
		const thumbButtons = screen.getAllByRole("button", {
			name: /view photo \d+/i,
		});
		fireEvent.click(thumbButtons[2]);
		// All photo 3 imgs exist (main + thumbnail); the main stays in the DOM but
		// this test confirms the switcher fires without throwing
		expect(thumbButtons[2].className).toContain("ring-accent");
	});

	it("ArrowRight key advances to the next image", () => {
		render(<ImageGallery vehicle={makeVehicle()} />);
		const region = screen.getByRole("region", { name: /image gallery/i });
		fireEvent.keyDown(region, { key: "ArrowRight" });
		const thumbButtons = screen.getAllByRole("button", {
			name: /view photo \d+/i,
		});
		expect(thumbButtons[1].className).toContain("ring-accent");
	});

	it("ArrowLeft key wraps to the last image from first", () => {
		render(<ImageGallery vehicle={makeVehicle()} />);
		const region = screen.getByRole("region", { name: /image gallery/i });
		fireEvent.keyDown(region, { key: "ArrowLeft" });
		const thumbButtons = screen.getAllByRole("button", {
			name: /view photo \d+/i,
		});
		expect(thumbButtons[2].className).toContain("ring-accent");
	});

	it("renders a single image slot with no thumbnail strip when vehicle has no images", () => {
		render(<ImageGallery vehicle={makeVehicle({ images: [] })} />);
		const imgs = screen.getAllByRole("img");
		expect(imgs.length).toBe(1);
		expect(screen.queryByRole("button", { name: /view photo/i })).toBeNull();
	});
});
