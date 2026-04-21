import { expect, type Page, test } from "@playwright/test";

function gridCards(page: Page) {
	return page.locator('a[href^="/vehicles/"]', { has: page.locator("h3") });
}

function parseDollarAmount(text: string): number {
	const match = text.match(/\$([\d,]+)/);
	if (!match) throw new Error(`No dollar amount in "${text}"`);
	return Number.parseInt(match[1].replace(/,/g, ""), 10);
}

test.describe("Filter and Sort", () => {
	test("SUV filter narrows results, price-asc orders correctly, clear restores", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(gridCards(page).first()).toBeVisible({ timeout: 15_000 });

		// Record total vehicle count from the results-count line near the grid.
		// When no filters are active it reads "{N} vehicles available" /
		// "{1} vehicle available" / "{0} vehicles available".
		const totalCountText = await page
			.locator("text=/(\\d+)\\s+vehicles?\\s+available/")
			.first()
			.innerText();
		const totalMatch = totalCountText.match(/(\d+)/);
		if (!totalMatch)
			throw new Error(`Could not parse total: "${totalCountText}"`);
		const totalCount = Number.parseInt(totalMatch[1], 10);
		expect(totalCount).toBeGreaterThan(0);

		// Open the filter drawer and toggle SUV body_style. The name "SUV" also
		// matches the hero CategoryChips pill (exclusive select), so scope the
		// locator to the dialog to pick the drawer's pill unambiguously. The
		// Body Style section can sit below the drawer fold; scroll the button to
		// the CENTER of the viewport so the drawer's sticky gradient header
		// doesn't cover it.
		await page.getByRole("button", { name: /^Filters/ }).click();
		const drawer = page.getByRole("dialog", { name: /filters/i });
		await expect(drawer).toBeVisible();
		const suvBtn = drawer.getByRole("button", {
			name: "SUV",
			pressed: false,
		});
		// The drawer has `scroll-pt-24` so the sticky gradient header doesn't
		// cover items scrolled into view — default Playwright scroll-then-click
		// works without force.
		await suvBtn.scrollIntoViewIfNeeded();
		await suvBtn.click();

		// URL contains bodyStyle param
		await expect(page).toHaveURL(/[?&]bodyStyle=SUV/);

		// Filtered count line appears: "Showing X of Y vehicles" — extract X.
		const filteredText = await page
			.locator("text=/Showing\\s+\\d+\\s+of\\s+\\d+\\s+vehicles/")
			.first()
			.innerText();
		const filteredMatch = filteredText.match(/Showing\s+(\d+)\s+of\s+(\d+)/);
		if (!filteredMatch)
			throw new Error(`Could not parse filtered count: "${filteredText}"`);
		const filteredCount = Number.parseInt(filteredMatch[1], 10);
		const reportedTotal = Number.parseInt(filteredMatch[2], 10);
		expect(filteredCount).toBeLessThan(totalCount);
		expect(reportedTotal).toBe(totalCount);

		// Apply price low→high sort
		await page
			.getByRole("combobox", { name: /sort vehicles/i })
			.selectOption("price_asc");
		await expect(page).toHaveURL(/[?&]sort=price_asc/);

		// Get first two visible card prices and verify ascending. Each grid card
		// has exactly one price element rendered as font-mono text-xl in amber.
		const visibleCards = gridCards(page);
		// Prices live in the price <p> using the text-accent-gradient utility —
		// pick by class to avoid catching the badge or other monospace text.
		const priceTexts = await visibleCards
			.locator("p.text-accent-gradient")
			.allInnerTexts();
		expect(priceTexts.length).toBeGreaterThanOrEqual(2);
		const first = parseDollarAmount(priceTexts[0]);
		const second = parseDollarAmount(priceTexts[1]);
		expect(first).toBeLessThanOrEqual(second);

		// Clear filters via the in-panel "Clear all filters" button (only renders
		// when a filter is active).
		await page.getByRole("button", { name: /clear all filters/i }).click();

		// URL no longer carries bodyStyle (sort persists; clearFilters is per-spec
		// only for filter chips/ranges, not sort). Wait for the count line to
		// return to "{total} vehicles available".
		await expect(page).not.toHaveURL(/[?&]bodyStyle=/);
		await expect(
			page.locator(`text=${String(totalCount)} vehicles available`),
		).toBeVisible({ timeout: 5_000 });
	});
});
