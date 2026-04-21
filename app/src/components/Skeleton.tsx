import { cn } from "../lib/cn";

type SkeletonProps = {
	className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"rounded-xl bg-surface-subtle motion-safe:animate-[shimmer_2s_linear_infinite] bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--color-surface-subtle)_0%,var(--color-surface-hover)_50%,var(--color-surface-subtle)_100%)]",
				className,
			)}
		/>
	);
}

export function VehicleCardSkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading"
			className="overflow-hidden rounded-3xl border border-border bg-surface"
		>
			<Skeleton className="h-72 rounded-none" />
			<div className="space-y-4 p-6">
				<Skeleton className="h-6 w-3/4" />
				<Skeleton className="h-10 w-1/2" />
				<div className="grid grid-cols-2 gap-3">
					<Skeleton className="h-10 rounded-xl" />
					<Skeleton className="h-10 rounded-xl" />
					<Skeleton className="h-10 rounded-xl" />
					<Skeleton className="h-10 rounded-xl" />
				</div>
				<Skeleton className="h-4 w-3/4" />
			</div>
		</div>
	);
}

export function DetailSkeleton() {
	return (
		<div role="status" aria-label="Loading vehicle">
			<Skeleton className="mb-4 h-6 w-32" />
			<Skeleton className="mb-6 h-10 w-96 max-w-full" />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				<div className="space-y-6 lg:col-span-7">
					<Skeleton className="aspect-video w-full rounded-2xl" />
					<Skeleton className="h-64 w-full rounded-2xl" />
					<Skeleton className="h-40 w-full rounded-2xl" />
				</div>
				<div className="lg:col-span-5">
					<Skeleton className="h-80 w-full rounded-2xl" />
				</div>
			</div>
		</div>
	);
}
