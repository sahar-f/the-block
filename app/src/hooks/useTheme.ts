import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

type ThemeContextValue = { isDark: boolean; toggle: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);
export const ThemeProvider = ThemeContext.Provider;

export function useThemeContext(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useThemeContext used outside ThemeProvider");
	return ctx;
}

function readInitial(): boolean {
	try {
		const stored = localStorage.getItem("theme");
		if (stored === "dark") return true;
		if (stored === "light") return false;
		return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
	} catch {
		return false;
	}
}

export function useTheme() {
	const [isDark, setIsDark] = useState<boolean>(readInitial);

	useEffect(() => {
		const root = document.documentElement;
		if (isDark) root.classList.add("dark");
		else root.classList.remove("dark");
	}, [isDark]);

	const toggle = useCallback(() => {
		setIsDark((prev) => {
			const next = !prev;
			try {
				localStorage.setItem("theme", next ? "dark" : "light");
			} catch {
				/* localStorage unavailable; in-memory only */
			}
			return next;
		});
	}, []);

	return { isDark, toggle };
}
