import { cn } from "../lib/cn";

type SkeletonProps = {
	className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"rounded-lg bg-surface motion-safe:animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%] bg-gradient-to-r from-surface via-[#1e1e22] to-surface",
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
			className="rounded-lg border border-border bg-surface overflow-hidden"
		>
			<Skeleton className="aspect-[4/3] rounded-none" />
			<div className="p-4 space-y-3">
				<Skeleton className="h-5 w-3/4" />
				<div className="flex justify-between">
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-4 w-16" />
				</div>
				<div className="flex justify-between">
					<Skeleton className="h-5 w-12" />
					<Skeleton className="h-4 w-28" />
				</div>
				<Skeleton className="h-3 w-32" />
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
					<Skeleton className="aspect-video w-full" />
					<Skeleton className="h-64 w-full" />
					<Skeleton className="h-40 w-full" />
				</div>
				<div className="lg:col-span-5">
					<Skeleton className="h-80 w-full" />
				</div>
			</div>
		</div>
	);
}
