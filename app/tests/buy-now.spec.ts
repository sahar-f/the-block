import { expect, type Page, test } from "@playwright/test";

function gridCards(page: Page) {
	return page.locator('a[href^="/vehicles/"]', { has: page.locator("h3") });
}

/**
 * Walk every Live grid card and land on the first detail page that ALSO
 * exposes a "Buy now" CTA. Auction times are normalized at runtime so which
 * vehicles are Live varies per page load. We commit to the FIRST live+buy-now
 * detail page we land on — re-navigating would reload the module and could
 * push a borderline-Live auction past its end boundary.
 */
async function gotoLiveBuyNowDetail(page: Page): Promise<void> {
	await page.goto("/");
	await expect(gridCards(page).first()).toBeVisible({ timeout: 15_000 });

	const liveBadges = page.locator(
		'[aria-label="Auction status: Live"]:not([aria-hidden="true"])',
	);
	const count = await liveBadges.count();

	// Default sort is "ending_soon" → liveBadges[0] has the LEAST time left and
	// is most likely to cross the end boundary mid-test. Iterate in reverse so
	// we land on the longest-remaining live vehicle first.
	for (let i = count - 1; i >= 0; i--) {
		const link = liveBadges
			.nth(i)
			.locator('xpath=ancestor::a[starts-with(@href, "/vehicles/")][1]');
		const hasH3 = (await link.locator("h3").count()) > 0;
		if (!hasH3) continue;
		const href = await link.getAttribute("href");
		if (!href) continue;

		await page.goto(href);

		// Wait for BidPanel to finish rendering (Supabase fetch is async — the
		// bid section may not exist yet on first paint).
		const bidSection = page.locator('aside[aria-label="Bidding"]');
		await expect(bidSection).toBeVisible({ timeout: 10_000 });

		const buyBtn = page.getByRole("button", { name: /buy now/i });
		const liveBadge = bidSection.locator('[aria-label="Auction status: Live"]');
		if ((await buyBtn.count()) > 0 && (await liveBadge.count()) > 0) {
			return;
		}

		await page.goBack();
		await expect(gridCards(page).first()).toBeVisible({ timeout: 10_000 });
	}

	throw new Error("No Live vehicle with a Buy Now option found in the grid");
}

test.describe("Buy Now", () => {
	test("clicking Buy Now confirms, locks the auction, shows 'Sold to you'", async ({
		page,
	}) => {
		await gotoLiveBuyNowDetail(page);

		// Auto-accept the window.confirm() that BidPanel uses to gate Buy Now.
		page.once("dialog", (d) => {
			void d.accept();
		});

		const buyBtn = page.getByRole("button", { name: /buy now/i });
		await expect(buyBtn).toBeVisible();
		const buyLabel = (await buyBtn.getAttribute("aria-label")) ?? "";
		const priceMatch = buyLabel.match(/\$([\d,]+)/);
		expect(priceMatch).not.toBeNull();
		const buyPrice = priceMatch?.[0] ?? "";

		await buyBtn.click();

		// Success: "Sold to you" status pill appears with the buy price; the bid
		// form (input + Place Bid + Buy Now buttons) all disappear.
		const sold = page.getByRole("status").filter({ hasText: /sold to you/i });
		await expect(sold).toBeVisible({ timeout: 10_000 });
		await expect(sold).toContainText(buyPrice);

		await expect(page.getByLabel(/your bid/i)).toHaveCount(0);
		await expect(
			page.getByRole("button", { name: /place a bid/i }),
		).toHaveCount(0);
		await expect(page.getByRole("button", { name: /buy now/i })).toHaveCount(0);
	});
});
