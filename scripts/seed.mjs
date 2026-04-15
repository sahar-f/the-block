// Sync Supabase to data/vehicles.json (canonical source). Idempotent — safe to
// re-run any time the DB drifts (accumulated test bids, manual mutations, etc).
//
// Requires SUPABASE_SERVICE_ROLE_KEY because raw UPDATE on vehicles + DELETE on
// bids both bypass anon RLS. Get it from Supabase dashboard → Settings → API.
//
// Run from /app: `npm run seed`

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(scriptDir, "../app/data/vehicles.json");

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
	console.error(
		"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to app/.env",
	);
	console.error(
		"(SERVICE_ROLE_KEY lives in Supabase dashboard → Settings → API)",
	);
	process.exit(1);
}

const supabase = createClient(url, key, {
	auth: { persistSession: false },
});

const vehicles = JSON.parse(readFileSync(dataPath, "utf8"));

console.log(`Upserting ${String(vehicles.length)} vehicles…`);
const rows = vehicles.map((v) => ({ id: v.id, data: v }));
const { error: upsertErr } = await supabase
	.from("vehicles")
	.upsert(rows, { onConflict: "id" });
if (upsertErr) {
	console.error("Upsert failed:", upsertErr.message);
	process.exit(1);
}

console.log("Clearing bids…");
const { error: deleteErr } = await supabase
	.from("bids")
	.delete()
	.not("id", "is", null);
if (deleteErr) {
	console.error("Delete failed:", deleteErr.message);
	process.exit(1);
}

console.log(`Done. ${String(vehicles.length)} vehicles synced, bids cleared.`);
