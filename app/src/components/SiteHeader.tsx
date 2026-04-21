import { Gavel } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useThemeContext } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
	const { isDark, toggle } = useThemeContext();
	return (
		<motion.header
			initial={{ y: -80 }}
			animate={{ y: 0 }}
			transition={{ type: "spring", damping: 22, stiffness: 180 }}
			className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-xl"
			role="banner"
		>
			<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
				<Link
					to="/"
					aria-label="The Block — home"
					className="group inline-flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
				>
					<span className="bg-accent-gradient inline-flex size-12 items-center justify-center rounded-2xl shadow-lg">
						<Gavel className="size-6 text-white" />
					</span>
					<span className="flex flex-col leading-tight">
						<span className="text-accent-gradient font-heading text-2xl font-bold">
							The Block
						</span>
						<span className="text-xs uppercase tracking-widest text-text-muted">
							Vehicle Auctions
						</span>
					</span>
				</Link>
				<ThemeToggle isDark={isDark} onToggle={toggle} />
			</div>
		</motion.header>
	);
}
