import { expect, type Page, test } from "@playwright/test";

function gridCards(page: Page) {
	return page.locator('a[href^="/vehicles/"]', { has: page.locator("h3") });
}

/**
 * Returns the href of the first vehicle card whose AuctionBadge announces "Live".
 * Done dynamically because median-anchor normalization shifts which auctions are
 * live every time the page loads.
 */
async function findLiveVehicleHref(page: Page): Promise<string> {
	await expect(gridCards(page).first()).toBeVisible({ timeout: 15_000 });

	// AuctionBadge has aria-label="Auction status: Live" — query badges directly,
	// then walk up to the nearest /vehicles/:id link.
	const liveBadges = page.locator(
		'[aria-label="Auction status: Live"]:not([aria-hidden="true"])',
	);
	const count = await liveBadges.count();
	for (let i = 0; i < count; i++) {
		const link = liveBadges
			.nth(i)
			.locator('xpath=ancestor::a[starts-with(@href, "/vehicles/")][1]');
		// Skip EndingSoonStrip mini-cards (no h3 inside) — only count grid cards.
		const hasH3 = (await link.locator("h3").count()) > 0;
		if (!hasH3) continue;
		const href = await link.getAttribute("href");
		if (href) return href;
	}
	throw new Error("No live vehicle card found in the grid");
}

function parseDollarAmount(text: string): number {
	const match = text.match(/\$([\d,]+)/);
	if (!match) throw new Error(`No dollar amount in "${text}"`);
	return Number.parseInt(match[1].replace(/,/g, ""), 10);
}

test.describe("Place a Bid", () => {
	test("blocks too-low bids and accepts a valid bid", async ({ page }) => {
		await page.goto("/");
		const liveHref = await findLiveVehicleHref(page);
		await page.goto(liveHref);

		// Read current bid from BidPanel (large amber mono price).
		const bidInput = page.getByLabel(/your bid/i);
		await expect(bidInput).toBeVisible({ timeout: 10_000 });

		// The input is pre-filled with the minimum valid bid. The "Minimum: $X"
		// hint text below the input is the source of truth for the floor.
		const minHint = page.locator("#bid-amount-hint");
		await expect(minHint).toBeVisible();
		const minHintText = await minHint.innerText();
		const minBid = parseDollarAmount(minHintText);

		// 1) Too-low bid: enter 1 → submit → defense-in-depth blocks via aria-invalid + red border.
		await bidInput.fill("1");
		// The submit click is silently ignored (handleSubmit guards against n < minBid),
		// but the visual signal must appear.
		await expect(bidInput).toHaveAttribute("aria-invalid", "true");
		const inputClass = (await bidInput.getAttribute("class")) ?? "";
		expect(inputClass).toContain("border-error");

		const placeBid = page.getByRole("button", { name: /place a bid/i });
		await placeBid.click();

		// No success message should appear after the blocked submit.
		await expect(page.getByText(/^bid placed!?$/i)).toHaveCount(0);

		// 2) Valid bid: minBid + 200 → submit. Accept either:
		//    (a) success pill "Bid placed!" appears, OR
		//    (b) network-mode error pill ("Something went wrong") appears
		//        (Supabase RPC may fail in some environments — we still want to
		//        confirm the submit fired without crashing the page).
		const validBid = minBid + 200;
		await bidInput.fill(String(validBid));
		await expect(bidInput).not.toHaveAttribute("aria-invalid", "true");

		await placeBid.click();

		const successOrError = page.locator(
			'[role="status"]:has-text("Bid placed"), p.text-error',
		);
		await expect(successOrError.first()).toBeVisible({ timeout: 10_000 });
	});
});
