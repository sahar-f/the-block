import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "../lib/constants";

type SearchBarProps = {
	value: string;
	onChange: (query: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
	const [inputValue, setInputValue] = useState(value);

	useEffect(() => {
		setInputValue(value);
	}, [value]);

	useEffect(() => {
		if (inputValue === value) return;

		const timer = setTimeout(() => {
			onChange(inputValue);
		}, SEARCH_DEBOUNCE_MS);

		return () => clearTimeout(timer);
	}, [inputValue, onChange, value]);

	const handleClear = useCallback(() => {
		setInputValue("");
		onChange("");
	}, [onChange]);

	return (
		<div className="relative flex-1 rounded-2xl transition-shadow focus-within:shadow-lg focus-within:shadow-indigo-500/10">
			<Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
			<input
				type="search"
				aria-label="Search vehicles"
				placeholder="Search by make, model, year, VIN, or lot..."
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				// [&::-webkit-search-cancel-button]:appearance-none hides the
				// browser's native clear — we render our own with a proper aria-label.
				className="w-full min-h-11 rounded-2xl border border-border bg-surface/90 py-3 pl-11 pr-11 font-body text-sm text-text-primary backdrop-blur-sm transition-colors placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-page [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
			/>
			{inputValue.length > 0 ? (
				<button
					type="button"
					onClick={handleClear}
					aria-label="Clear search"
					className="absolute right-1 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
				>
					<X className="size-4" />
				</button>
			) : null}
		</div>
	);
}
