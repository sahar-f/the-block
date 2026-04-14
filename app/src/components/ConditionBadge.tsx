import { cn } from "../lib/cn";

type ConditionBadgeProps = {
	grade: number;
};

export function ConditionBadge({ grade }: ConditionBadgeProps) {
	const color =
		grade >= 4
			? "bg-success/10 text-success"
			: grade >= 3
				? "bg-warning/10 text-warning"
				: "bg-error/10 text-error";

	return (
		<span
			role="img"
			aria-label={`Condition grade: ${grade.toFixed(1)} of 5`}
			className={cn(
				"inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-medium",
				color,
			)}
		>
			{grade.toFixed(1)}
		</span>
	);
}
