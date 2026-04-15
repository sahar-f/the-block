export type Vehicle = {
	id: string;
	vin: string;
	year: number;
	make: string;
	model: string;
	trim: string;
	body_style: string;
	exterior_color: string;
	interior_color: string;
	engine: string;
	transmission: string;
	drivetrain: string;
	odometer_km: number;
	fuel_type: string;
	condition_grade: number;
	condition_report: string;
	damage_notes: string[];
	title_status: string;
	province: string;
	city: string;
	auction_start: string;
	starting_bid: number;
	reserve_price: number | null;
	buy_now_price: number | null;
	images: string[];
	selling_dealership: string;
	lot: string;
	current_bid: number | null;
	bid_count: number;
};

export type AuctionStatus = "upcoming" | "live" | "ended";

export type AuctionState = {
	status: AuctionStatus;
	timeRemaining: number;
};

export type Bid = {
	id: string;
	vehicle_id: string;
	amount: number;
	bidder_session: string;
	created_at: string;
};

export type BidError =
	| { type: "auction_ended" }
	| { type: "bid_too_low"; minimum: number }
	| { type: "network" };

export type BidResult =
	| { success: true; bid: Bid }
	| { success: false; error: BidError };

export type FilterState = {
	query: string;
	bodyStyle: string[];
	province: string[];
	drivetrain: string[];
	fuelType: string[];
	transmission: string[];
	titleStatus: string[];
	auctionStatus: AuctionStatus[];
	priceMin: number | null;
	priceMax: number | null;
	conditionMin: number | null;
	conditionMax: number | null;
	sort: SortOption;
};

export type SortOption =
	| "price_asc"
	| "price_desc"
	| "year_desc"
	| "condition_desc"
	| "ending_soon"
	| "most_bids";
