import { motion } from "motion/react";

type CategoryChipsProps = {
	current: string[];
	onSelect: (value: string | null) => void;
};

// Values match body_style casing in vehicles.json exactly (FilterPanel enum).
const CATEGORIES = [
	{ label: "All Vehicles", value: null },
	{ label: "SUV", value: "SUV" },
	{ label: "Sedan", value: "sedan" },
	{ label: "Truck", value: "truck" },
	{ label: "Coupe", value: "coupe" },
] as const;

export function CategoryChips({ current, onSelect }: CategoryChipsProps) {
	return (
		<div
			role="toolbar"
			aria-label="Vehicle category"
			className="mt-8 flex flex-wrap justify-center gap-3"
		>
			{CATEGORIES.map((cat, i) => {
				const isActive =
					cat.value === null
						? current.length === 0
						: current.length === 1 && current[0] === cat.value;
				return (
					<motion.button
						key={cat.label}
						type="button"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: i * 0.05 }}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-pressed={isActive}
						onClick={() => {
							onSelect(cat.value);
						}}
						className={
							isActive
								? "rounded-full bg-surface px-6 py-2.5 text-sm font-semibold text-accent shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
								: "rounded-full bg-white/20 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
						}
					>
						{cat.label}
					</motion.button>
				);
			})}
		</div>
	);
}
