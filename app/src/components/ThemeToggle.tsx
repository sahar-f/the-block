import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

type ThemeToggleProps = {
	isDark: boolean;
	onToggle: () => void;
};

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
	return (
		<motion.button
			type="button"
			onClick={onToggle}
			aria-label="Toggle theme"
			aria-pressed={isDark}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			className="relative inline-flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-0.5 shadow-sm transition-colors dark:from-gray-700 dark:to-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
		>
			<span className="flex size-full items-center justify-center rounded-full bg-surface">
				<motion.span
					initial={false}
					animate={{ rotate: isDark ? 180 : 0 }}
					transition={{ duration: 0.5, ease: "easeInOut" }}
					className="inline-flex"
				>
					{isDark ? (
						<Moon className="size-5 text-accent" />
					) : (
						<Sun className="size-5 text-warning" />
					)}
				</motion.span>
			</span>
		</motion.button>
	);
}
