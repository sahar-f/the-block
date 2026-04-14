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
		<div className="relative flex-1 rounded-lg transition-shadow focus-within:shadow-lg focus-within:shadow-amber-500/10">
			<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
			<input
				type="text"
				aria-label="Search vehicles"
				placeholder="Search by make, model, year, VIN, or lot..."
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-10 font-body text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-page focus:shadow-[0_0_0_4px_rgba(245,158,11,0.1)]"
			/>
			{inputValue.length > 0 ? (
				<button
					type="button"
					onClick={handleClear}
					aria-label="Clear search"
					className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
				>
					<X className="size-4" />
				</button>
			) : null}
		</div>
	);
}
