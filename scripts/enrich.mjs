// Build-time AI enrichment. Generates a 2-sentence `condition_summary` for
// each vehicle in `app/data/vehicles.json` via Claude Haiku 4.5. Idempotent
// across completed runs — skips vehicles that already have a non-empty
// summary. Writes all results in a single end-of-run write; a Ctrl-C mid-run
// discards in-memory progress and re-run resumes from the last committed
// state.
//
// Run from /app: `npm run enrich`
// Requires ANTHROPIC_API_KEY in app/.env (from console.anthropic.com).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(scriptDir, "../app/data/vehicles.json");

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
	console.error("Missing ANTHROPIC_API_KEY. Add it to app/.env.");
	console.error("(Get from console.anthropic.com → API Keys)");
	process.exit(1);
}

console.log(
	"Tip: stop the dev server before enriching to avoid file-watcher races.",
);

const client = new Anthropic({ apiKey });
const vehicles = JSON.parse(readFileSync(dataPath, "utf8"));

function buildPrompt(v) {
	const vehicleFields = {
		year: v.year,
		make: v.make,
		model: v.model,
		trim: v.trim,
		odometer_km: v.odometer_km,
		condition_grade: v.condition_grade,
		condition_report: v.condition_report,
		damage_notes: v.damage_notes,
		title_status: v.title_status,
		body_style: v.body_style,
	};
	return `You are describing a vehicle for a buyer on an auction platform.

Given the provided fields, produce a JSON object:
{
  "summary": "<exactly 2 sentences, 180-260 characters total>"
}

Rules:
- Base the summary only on the provided fields. Do not infer features, options, or equipment that are not explicitly listed.
- Sentence 1: condition read — synthesize condition_grade, condition_report, damage_notes into a buyer-scannable summary.
- Sentence 2: mechanical/usage context — odometer, title status, and any specific damage the buyer should know about.
- Do not quote a price, value, or appraisal.
- Do not claim the vehicle has been inspected by you.
- Respond with a single JSON object, no prose, no code fences.

Vehicle: ${JSON.stringify(vehicleFields)}`;
}

function parseResponse(text) {
	// Step 1: happy path
	try {
		return JSON.parse(text.trim());
	} catch {}
	// Step 2: strip markdown code fences
	const fenceStripped = text.replace(/```(?:json)?\n?/g, "").trim();
	try {
		return JSON.parse(fenceStripped);
	} catch {}
	// Step 3: greedy regex for first {...} block
	const match = text.match(/\{[\s\S]*\}/);
	if (match) {
		try {
			return JSON.parse(match[0]);
		} catch {}
	}
	return null;
}

function isValidSummary(s) {
	return (
		typeof s === "string" &&
		s.length >= 80 &&
		s.length <= 400 &&
		!s.includes("$") &&
		!s.includes("<")
	);
}

function hasSummary(v) {
	return (
		typeof v.condition_summary === "string" &&
		v.condition_summary.trim().length > 0
	);
}

let processed = 0;
let skipped = 0;
let failed = 0;

for (const v of vehicles) {
	if (hasSummary(v)) {
		skipped++;
		continue;
	}
	try {
		const resp = await client.messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 500,
			temperature: 0.2,
			messages: [{ role: "user", content: buildPrompt(v) }],
		});
		const first = resp.content[0];
		const text = first && first.type === "text" ? first.text : "";
		const parsed = parseResponse(text);
		if (parsed && isValidSummary(parsed.summary)) {
			v.condition_summary = parsed.summary;
			processed++;
		} else {
			console.warn(`[${v.id}] Invalid response:`, text.slice(0, 200));
			failed++;
		}
	} catch (err) {
		console.warn(`[${v.id}] API error:`, err.message);
		failed++;
	}
	if ((processed + failed) % 10 === 0 && processed + failed > 0) {
		console.log(
			`...${processed + failed} calls complete (${processed} ok, ${failed} failed)`,
		);
	}
}

writeFileSync(dataPath, JSON.stringify(vehicles, null, "\t"));

console.log(
	`\nDone. ${processed} enriched, ${skipped} skipped (already had summary), ${failed} failed.`,
);

const missing = vehicles.filter((v) => !hasSummary(v));
if (missing.length > 0) {
	console.error(
		`\n${missing.length} vehicles still missing condition_summary:`,
	);
	for (const v of missing) {
		console.error(`  - ${v.id} (${v.year} ${v.make} ${v.model})`);
	}
	console.error("\nRe-run `npm run enrich` to retry these (idempotent).");
	process.exit(1);
}
