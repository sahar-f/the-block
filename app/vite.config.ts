import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function faviconVersioner(): Plugin {
	let root = "";
	return {
		name: "favicon-versioner",
		apply: "build",
		configResolved(config) {
			root = config.root;
		},
		transformIndexHtml(html) {
			const bytes = readFileSync(resolve(root, "public/favicon.svg"));
			const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
			const replaced = html.replace(
				'href="/favicon.svg"',
				`href="/favicon.svg?v=${hash}"`,
			);
			if (replaced === html) {
				throw new Error(
					'favicon-versioner: expected href="/favicon.svg" in index.html',
				);
			}
			return replaced;
		},
	};
}

export default defineConfig({
	plugins: [react(), tailwindcss(), faviconVersioner()],
});
