import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bid, BidResult, Vehicle } from "../types";
import {
	applyOffset,
	computeNormalizeOffset,
	normalizeAuctionTimes,
} from "./auction";
import { getSessionId } from "./session";

let vehicles: Vehicle[] = [];
let normalizeOffset = 0;
const subscribers = new Set<() => void>();
let initialized = false;
let initError: string | null = null;
let initPromise: Promise<void> | null = null;
let supabase: SupabaseClient | null = null;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
	| string
	| undefined;
const isSupabase = Boolean(supabaseUrl && supabaseKey);

function notifySubscribers() {
	for (const cb of subscribers) {
		cb();
	}
}

async function initSupabase(): Promise<void> {
	if (!supabaseUrl || !supabaseKey) return;

	const { createClient } = await import("@supabase/supabase-js");
	supabase = createClient(supabaseUrl, supabaseKey);

	const { data, error } = await supabase.from("vehicles").select("id, data");

	if (error) {
		throw new Error(`Failed to fetch vehicles: ${error.message}`);
	}

	const raw = (data ?? []).map(
		(row: { id: string; data: unknown }) => row.data as Vehicle,
	);
	normalizeOffset = computeNormalizeOffset(raw);
	vehicles = normalizeAuctionTimes(raw);

	supabase
		.channel("vehicles-changes")
		.on(
			"postgres_changes",
			{ event: "UPDATE", schema: "public", table: "vehicles" },
			(payload) => {
				const updated = payload.new as { id: string; data: Vehicle };
				const normalized = applyOffset(updated.data, normalizeOffset);
				const index = vehicles.findIndex((v) => v.id === normalized.id);
				if (index !== -1) {
					vehicles = vehicles.map((v, i) => (i === index ? normalized : v));
					notifySubscribers();
				}
			},
		)
		.on(
			"postgres_changes",
			{ event: "INSERT", schema: "public", table: "vehicles" },
			(payload) => {
				const inserted = payload.new as { id: string; data: Vehicle };
				vehicles = [...vehicles, applyOffset(inserted.data, normalizeOffset)];
				notifySubscribers();
			},
		)
		.subscribe();
}

async function initFallback(): Promise<void> {
	const raw = (await import("../../data/vehicles.json")).default as Vehicle[];
	vehicles = normalizeAuctionTimes(raw);
}

async function ensureInit(): Promise<void> {
	if (initialized) return;
	if (initPromise) return initPromise;

	initPromise = (isSupabase ? initSupabase() : initFallback())
		.then(() => {
			initialized = true;
			notifySubscribers();
		})
		.catch((err: unknown) => {
			initialized = true;
			if (import.meta.env.DEV) console.error("dataStore init failed:", err);
			initError = "Couldn't load vehicles. Please refresh.";
			notifySubscribers();
		});

	return initPromise;
}

ensureInit();

export function getVehicles(): Vehicle[] {
	return vehicles;
}

export function getVehicle(id: string): Vehicle | null {
	return vehicles.find((v) => v.id === id) ?? null;
}

export function getIsInitialized(): boolean {
	return initialized;
}

export function getInitError(): string | null {
	return initError;
}

export function subscribe(callback: () => void): () => void {
	subscribers.add(callback);
	return () => {
		subscribers.delete(callback);
	};
}

function applyLocalBid(vehicleId: string, amount: number): void {
	const idx = vehicles.findIndex((v) => v.id === vehicleId);
	if (idx === -1) return;
	const updated: Vehicle = {
		...vehicles[idx],
		current_bid: amount,
		bid_count: vehicles[idx].bid_count + 1,
	};
	vehicles = vehicles.map((v, i) => (i === idx ? updated : v));
	notifySubscribers();
}

export async function submitBid(
	vehicleId: string,
	amount: number,
): Promise<BidResult> {
	const session = getSessionId();

	if (supabase) {
		try {
			// Atomic RPC: validates auction state + min bid, inserts the bid row,
			// and patches vehicles.data in a single transaction (SECURITY DEFINER).
			// Do NOT replace with direct INSERT + UPDATE — that path has a TOCTOU
			// race that loses bid_count under concurrent bidders.
			const { data, error } = await supabase.rpc("place_bid", {
				p_vehicle_id: vehicleId,
				p_amount: amount,
				p_bidder_session: session,
			});

			if (error || !data) {
				if (import.meta.env.DEV) {
					console.error("place_bid failed:", error);
				}
				return { success: false, error: { type: "network" } };
			}

			// Optimistic local update so the price moves immediately; the realtime
			// UPDATE subscription reconfirms with the same value shortly after.
			applyLocalBid(vehicleId, amount);

			const result = data as { id: string; created_at: string };
			return {
				success: true,
				bid: {
					id: result.id,
					vehicle_id: vehicleId,
					amount,
					bidder_session: session,
					created_at: result.created_at,
				},
			};
		} catch (err) {
			if (import.meta.env.DEV) console.error("place_bid threw:", err);
			return { success: false, error: { type: "network" } };
		}
	}

	// Fallback path: in-memory mutation (no Supabase configured)
	const vehicle = vehicles.find((v) => v.id === vehicleId);
	if (!vehicle) {
		return { success: false, error: { type: "network" } };
	}

	applyLocalBid(vehicleId, amount);

	const bid: Bid = {
		id: crypto.randomUUID(),
		vehicle_id: vehicleId,
		amount,
		bidder_session: session,
		created_at: new Date().toISOString(),
	};

	return { success: true, bid };
}
