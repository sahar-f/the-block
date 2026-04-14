import { cn } from "../lib/cn";
import type { AuctionStatus } from "../types";

type AuctionBadgeProps = {
	status: AuctionStatus;
};

const variants: Record<AuctionStatus, { bg: string; label: string }> = {
	live: { bg: "bg-success/15 text-success", label: "Live" },
	upcoming: { bg: "bg-blue-500/15 text-blue-400", label: "Upcoming" },
	ended: { bg: "bg-border text-text-muted", label: "Ended" },
};

export function AuctionBadge({ status }: AuctionBadgeProps) {
	const variant = variants[status];

	return (
		<span
			role="img"
			aria-label={`Auction status: ${variant.label}`}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium font-body",
				variant.bg,
			)}
		>
			{status === "live" ? (
				<span
					aria-hidden="true"
					className="size-2 rounded-full bg-success animate-pulse"
				/>
			) : null}
			{variant.label}
		</span>
	);
}
