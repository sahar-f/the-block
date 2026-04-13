import type { AuctionStatus, FilterState, SortOption, Vehicle } from "../types";
import { getAuctionStatus, parseAuctionStart } from "./auction";

const DEFAULT_SORT: SortOption = "ending_soon";

const VALID_SORTS = new Set<SortOption>([
	"price_asc",
	"price_desc",
	"year_desc",
	"condition_desc",
	"ending_soon",
	"most_bids",
]);

const VALID_AUCTION_STATUSES = new Set<AuctionStatus>([
	"upcoming",
	"live",
	"ended",
]);

function parseCommaSeparated(value: string | null): string[] {
	if (!value) return [];
	return value
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

const MAX_QUERY_LENGTH = 200;

function parseNumber(
	value: string | null,
	max: number = Number.POSITIVE_INFINITY,
): number | null {
	if (!value) return null;
	const n = Number(value);
	return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

export function parseFilters(searchParams: URLSearchParams): FilterState {
	const sort = searchParams.get("sort") as SortOption | null;
	const auctionStatusRaw = parseCommaSeparated(
		searchParams.get("auctionStatus"),
	);

	const rawQuery = searchParams.get("query") ?? "";

	return {
		query: rawQuery.slice(0, MAX_QUERY_LENGTH),
		bodyStyle: parseCommaSeparated(searchParams.get("bodyStyle")),
		province: parseCommaSeparated(searchParams.get("province")),
		drivetrain: parseCommaSeparated(searchParams.get("drivetrain")),
		fuelType: parseCommaSeparated(searchParams.get("fuelType")),
		transmission: parseCommaSeparated(searchParams.get("transmission")),
		titleStatus: parseCommaSeparated(searchParams.get("titleStatus")),
		auctionStatus: auctionStatusRaw.filter((s) =>
			VALID_AUCTION_STATUSES.has(s as AuctionStatus),
		) as AuctionStatus[],
		priceMin: parseNumber(searchParams.get("priceMin")),
		priceMax: parseNumber(searchParams.get("priceMax")),
		conditionMin: parseNumber(searchParams.get("conditionMin"), 5),
		conditionMax: parseNumber(searchParams.get("conditionMax"), 5),
		sort: sort && VALID_SORTS.has(sort) ? sort : DEFAULT_SORT,
	};
}

export function serializeFilters(filters: FilterState): URLSearchParams {
	const params = new URLSearchParams();

	if (filters.query) params.set("query", filters.query);
	if (filters.bodyStyle.length)
		params.set("bodyStyle", filters.bodyStyle.join(","));
	if (filters.province.length)
		params.set("province", filters.province.join(","));
	if (filters.drivetrain.length)
		params.set("drivetrain", filters.drivetrain.join(","));
	if (filters.fuelType.length)
		params.set("fuelType", filters.fuelType.join(","));
	if (filters.transmission.length)
		params.set("transmission", filters.transmission.join(","));
	if (filters.titleStatus.length)
		params.set("titleStatus", filters.titleStatus.join(","));
	if (filters.auctionStatus.length)
		params.set("auctionStatus", filters.auctionStatus.join(","));
	if (filters.priceMin !== null)
		params.set("priceMin", String(filters.priceMin));
	if (filters.priceMax !== null)
		params.set("priceMax", String(filters.priceMax));
	if (filters.conditionMin !== null)
		params.set("conditionMin", String(filters.conditionMin));
	if (filters.conditionMax !== null)
		params.set("conditionMax", String(filters.conditionMax));
	if (filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);

	return params;
}

function matchesText(vehicle: Vehicle, query: string): boolean {
	if (!query) return true;
	const q = query.toLowerCase();
	return (
		vehicle.make.toLowerCase().includes(q) ||
		vehicle.model.toLowerCase().includes(q) ||
		String(vehicle.year).includes(q) ||
		vehicle.vin.toLowerCase().includes(q) ||
		vehicle.lot.toLowerCase().includes(q)
	);
}

function matchesArray(value: string, allowed: string[]): boolean {
	if (allowed.length === 0) return true;
	return allowed.some((a) => a.toLowerCase() === value.toLowerCase());
}

function matchesRange(
	value: number | null,
	min: number | null,
	max: number | null,
): boolean {
	const v = value ?? 0;
	if (min !== null && v < min) return false;
	if (max !== null && v > max) return false;
	return true;
}

export function applyFilters(
	vehicles: Vehicle[],
	filters: FilterState,
	now: number,
): Vehicle[] {
	const filtered = vehicles.filter((v) => {
		if (!matchesText(v, filters.query)) return false;
		if (!matchesArray(v.body_style, filters.bodyStyle)) return false;
		if (!matchesArray(v.province, filters.province)) return false;
		if (!matchesArray(v.drivetrain, filters.drivetrain)) return false;
		if (!matchesArray(v.fuel_type, filters.fuelType)) return false;
		if (!matchesArray(v.transmission, filters.transmission)) return false;
		if (!matchesArray(v.title_status, filters.titleStatus)) return false;

		if (filters.auctionStatus.length > 0) {
			const { status } = getAuctionStatus(
				parseAuctionStart(v.auction_start),
				now,
			);
			if (!filters.auctionStatus.includes(status)) return false;
		}

		const price = v.current_bid ?? v.starting_bid;
		if (!matchesRange(price, filters.priceMin, filters.priceMax)) return false;

		if (
			!matchesRange(
				v.condition_grade,
				filters.conditionMin,
				filters.conditionMax,
			)
		)
			return false;

		return true;
	});

	return sortVehicles(filtered, filters.sort, now);
}

function sortVehicles(
	vehicles: Vehicle[],
	sort: SortOption,
	now: number,
): Vehicle[] {
	const sorted = [...vehicles];

	switch (sort) {
		case "price_asc":
			sorted.sort(
				(a, b) =>
					(a.current_bid ?? a.starting_bid) - (b.current_bid ?? b.starting_bid),
			);
			break;
		case "price_desc":
			sorted.sort(
				(a, b) =>
					(b.current_bid ?? b.starting_bid) - (a.current_bid ?? a.starting_bid),
			);
			break;
		case "year_desc":
			sorted.sort((a, b) => b.year - a.year);
			break;
		case "condition_desc":
			sorted.sort((a, b) => b.condition_grade - a.condition_grade);
			break;
		case "ending_soon": {
			sorted.sort((a, b) => {
				const aState = getAuctionStatus(
					parseAuctionStart(a.auction_start),
					now,
				);
				const bState = getAuctionStatus(
					parseAuctionStart(b.auction_start),
					now,
				);
				// Live auctions first (by time remaining), then upcoming, then ended
				const aOrder =
					aState.status === "live" ? 0 : aState.status === "upcoming" ? 1 : 2;
				const bOrder =
					bState.status === "live" ? 0 : bState.status === "upcoming" ? 1 : 2;
				if (aOrder !== bOrder) return aOrder - bOrder;
				return aState.timeRemaining - bState.timeRemaining;
			});
			break;
		}
		case "most_bids":
			sorted.sort((a, b) => b.bid_count - a.bid_count);
			break;
	}

	return sorted;
}
