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
	const raw = (await import("../../../data/vehicles.json"))
		.default as Vehicle[];
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
			initError =
				err instanceof Error ? err.message : "Failed to load vehicles.";
			notifySubscribers();
		});

	return initPromise;
}

// Kick off initialization immediately on module load
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

export async function submitBid(
	vehicleId: string,
	amount: number,
): Promise<BidResult> {
	const session = getSessionId();

	if (supabase) {
		try {
			const { data: rpcData, error: rpcError } = await supabase
				.rpc("place_bid", {
					p_vehicle_id: vehicleId,
					p_amount: amount,
					p_bidder_session: session,
				} as Record<string, unknown>)
				.single();

			if (rpcError) {
				return {
					success: false,
					error: { type: "network", message: rpcError.message },
				};
			}

			const row = rpcData as Record<string, string> | null;
			const bid: Bid = {
				id: row?.id ?? crypto.randomUUID(),
				vehicle_id: vehicleId,
				amount,
				bidder_session: session,
				created_at: row?.created_at ?? new Date().toISOString(),
			};

			return { success: true, bid };
		} catch {
			return {
				success: false,
				error: {
					type: "network",
					message: "Failed to submit bid. Please try again.",
				},
			};
		}
	}

	// Fallback: in-memory mutation
	const vehicle = vehicles.find((v) => v.id === vehicleId);
	if (!vehicle) {
		return {
			success: false,
			error: { type: "network", message: "Vehicle not found." },
		};
	}

	const updated = {
		...vehicle,
		current_bid: amount,
		bid_count: vehicle.bid_count + 1,
	};
	vehicles = vehicles.map((v) => (v.id === vehicleId ? updated : v));
	notifySubscribers();

	const bid: Bid = {
		id: crypto.randomUUID(),
		vehicle_id: vehicleId,
		amount,
		bidder_session: session,
		created_at: new Date().toISOString(),
	};

	return { success: true, bid };
}
