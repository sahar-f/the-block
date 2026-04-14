import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			environment: "jsdom",
			setupFiles: ["./src/test-setup.ts"],
			passWithNoTests: true,
			// Playwright e2e specs live in /tests; Vitest only runs co-located unit/component tests.
			include: ["src/**/*.{test,spec}.{ts,tsx}"],
		},
	}),
);
