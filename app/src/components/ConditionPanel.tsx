import { AlertTriangle, CheckCircle } from "lucide-react";
import { ConditionBadge } from "./ConditionBadge";

type ConditionPanelProps = {
	grade: number;
	report: string;
	damageNotes: string[];
};

export function ConditionPanel({
	grade,
	report,
	damageNotes,
}: ConditionPanelProps) {
	return (
		<section className="rounded-lg border border-border bg-surface p-6">
			<div className="mb-4 flex items-center gap-3">
				<h2 className="font-heading text-xl font-semibold text-text-primary">
					Condition
				</h2>
				<ConditionBadge grade={grade} />
			</div>
			<p className="mb-4 text-sm text-text-secondary leading-relaxed">
				{report}
			</p>
			{damageNotes.length > 0 ? (
				<ul className="space-y-2">
					{damageNotes.map((note) => (
						<li
							key={note}
							className="flex items-start gap-2 text-sm text-text-primary"
						>
							<AlertTriangle
								aria-hidden="true"
								className="mt-0.5 size-4 shrink-0 text-accent"
							/>
							<span>{note}</span>
						</li>
					))}
				</ul>
			) : (
				<div className="flex items-center gap-2 text-sm text-success">
					<CheckCircle aria-hidden="true" className="size-4 shrink-0" />
					<span>No damage reported</span>
				</div>
			)}
		</section>
	);
}
