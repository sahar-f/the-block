import { expect, test } from "@playwright/test";

/**
 * Returns vehicle-card links from the main grid (cards have an inner h3).
 * Excludes the EndingSoonStrip mini-cards which use compact <p> titles only.
 */
function gridCards(page: import("@playwright/test").Page) {
	return page.locator('a[href^="/vehicles/"]', { has: page.locator("h3") });
}

test.describe("Search and Browse", () => {
	test("renders grid, searches Ford, opens a detail page", async ({ page }) => {
		await page.goto("/");

		// Wait for the grid to render real cards (not skeletons)
		await expect(gridCards(page).first()).toBeVisible({ timeout: 15_000 });

		const initialCount = await gridCards(page).count();
		expect(initialCount).toBeGreaterThan(1);

		// Inventory landmarks: stats bar (total value) and Ending Soon strip both
		// render alongside the grid on initial load.
		await expect(page.getByText(/total\s+value/i)).toBeVisible();
		await expect(page.getByText(/ending\s+soon/i).first()).toBeVisible();

		// At least one visible card shows a selling_dealership text. We don't know
		// the exact dealer names, so verify the results-count line ("X vehicles
		// available" or "Showing X of Y vehicles") which proves the grid is wired
		// to real data, then assert the first card carries city/province/dealership
		// in its accessible text.
		const firstCardText = await gridCards(page).first().innerText();
		// Format on each card: "City, Province · Dealership"
		expect(firstCardText).toMatch(/[A-Z][a-z]+,\s+[A-Z][\w\s]+\s+·\s+\S+/);

		// Type "Ford" in the search input
		await page.getByRole("searchbox", { name: "Search vehicles" }).fill("Ford");

		// URL reflects the search after debounce
		await expect(page).toHaveURL(/[?&]query=Ford/, { timeout: 5_000 });

		// Wait for the grid to update (debounce + re-render)
		await expect
			.poll(async () => gridCards(page).count(), { timeout: 5_000 })
			.toBeLessThan(initialCount);

		// Verify all card titles contain "Ford" (case-insensitive).
		// Use allTextContents() rather than allInnerTexts() — motion's entrance
		// animation on newly-filtered cards may briefly hold opacity at 0, which
		// would make innerText (CSS-aware) return "" and flake this assertion.
		// textContent is the right tool here: we want the semantic text, not
		// what's visually rendered right this frame.
		const titles = await gridCards(page).locator("h3").allTextContents();
		expect(titles.length).toBeGreaterThan(0);
		for (const title of titles) {
			expect(title.toLowerCase()).toContain("ford");
		}

		// Click the first card and verify navigation to detail page
		const firstCard = gridCards(page).first();
		const firstCardHref = await firstCard.getAttribute("href");
		expect(firstCardHref).toMatch(/^\/vehicles\/[\w-]+$/);

		await firstCard.click();
		await expect(page).toHaveURL(/\/vehicles\/[\w-]+/);

		// Detail page has an h1 with vehicle title
		const heading = page.getByRole("heading", { level: 1 });
		await expect(heading).toBeVisible();
		await expect(heading).toContainText("Ford");

		// Specs section exists
		await expect(
			page.getByRole("heading", { level: 2, name: /specifications/i }),
		).toBeVisible();

		// Image gallery renders main image area + thumbnail buttons (one per image)
		const gallery = page.locator('section[aria-label="Image gallery"]');
		await expect(gallery).toBeVisible();
		expect(await gallery.locator("button").count()).toBeGreaterThan(0);

		// Condition badge present (every vehicle has a condition_grade)
		await expect(
			page.locator('[aria-label^="Condition grade"]').first(),
		).toBeVisible();

		// Bid section exists — accept any one of: bid input, Place Bid button, or
		// "Auction ended" / "Bidding opens in" placeholder.
		const bidInput = page.getByLabel(/your bid/i);
		const placeBid = page.getByRole("button", { name: /place a bid/i });
		const ended = page.getByText(/auction ended/i);
		const upcoming = page.getByText(/bidding opens in/i);
		const bidSectionVisible =
			(await bidInput.count()) > 0 ||
			(await placeBid.count()) > 0 ||
			(await ended.count()) > 0 ||
			(await upcoming.count()) > 0;
		expect(bidSectionVisible).toBe(true);

		await expect(
			page.getByRole("heading", { name: /condition summary/i }),
		).toBeVisible();

		const carfaxLink = page.getByRole("link", {
			name: /Check market value on CarFax Canada/i,
		});
		await expect(carfaxLink).toHaveAttribute(
			"href",
			"https://www.carfax.ca/whats-my-car-worth/car-value",
		);
		await expect(carfaxLink).toHaveAttribute("target", "_blank");
		await expect(carfaxLink).toHaveAttribute("rel", "noopener noreferrer");
	});
});
