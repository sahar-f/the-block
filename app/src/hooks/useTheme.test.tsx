import { act, renderHook as baseRenderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme, useThemeContext } from "./useTheme";

describe("useTheme", () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.classList.remove("dark");
		vi.stubGlobal(
			"matchMedia",
			vi.fn().mockReturnValue({
				matches: false,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			}),
		);
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("defaults to light when no localStorage and system is light", () => {
		const { result } = baseRenderHook(() => useTheme());
		expect(result.current.isDark).toBe(false);
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});

	it("reads dark from localStorage and applies .dark class", () => {
		localStorage.setItem("theme", "dark");
		const { result } = baseRenderHook(() => useTheme());
		expect(result.current.isDark).toBe(true);
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("reads light from localStorage even when system prefers dark", () => {
		vi.stubGlobal(
			"matchMedia",
			vi.fn().mockReturnValue({
				matches: true,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			}),
		);
		localStorage.setItem("theme", "light");
		const { result } = baseRenderHook(() => useTheme());
		expect(result.current.isDark).toBe(false);
	});

	it("falls back to system preference when localStorage empty", () => {
		vi.stubGlobal(
			"matchMedia",
			vi.fn().mockReturnValue({
				matches: true,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			}),
		);
		const { result } = baseRenderHook(() => useTheme());
		expect(result.current.isDark).toBe(true);
	});

	it("toggle flips state, class, and localStorage", () => {
		const { result } = baseRenderHook(() => useTheme());
		act(() => {
			result.current.toggle();
		});
		expect(result.current.isDark).toBe(true);
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(localStorage.getItem("theme")).toBe("dark");
		act(() => {
			result.current.toggle();
		});
		expect(result.current.isDark).toBe(false);
		expect(localStorage.getItem("theme")).toBe("light");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});
});

describe("useThemeContext", () => {
	it("throws outside ThemeProvider", () => {
		expect(() => baseRenderHook(() => useThemeContext())).toThrow(
			/useThemeContext used outside ThemeProvider/,
		);
	});

	it("returns context value when inside ThemeProvider", () => {
		const value = { isDark: true, toggle: () => undefined };
		const { result } = baseRenderHook(() => useThemeContext(), {
			wrapper: ({ children }) => (
				<ThemeProvider value={value}>{children}</ThemeProvider>
			),
		});
		expect(result.current.isDark).toBe(true);
	});
});
