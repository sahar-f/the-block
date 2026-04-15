import { useState } from "react";
import { getVehicleImageUrl } from "../lib/format";
import type { Vehicle } from "../types";

type ImageGalleryProps = {
	vehicle: Vehicle;
};

export function ImageGallery({ vehicle }: ImageGalleryProps) {
	const [activeIndex, setActiveIndex] = useState(0);
	const count = Math.max(vehicle.images.length, 1);
	const baseAlt = `${String(vehicle.year)} ${vehicle.make} ${vehicle.model}`;
	const srcAt = (i: number) => getVehicleImageUrl(vehicle, i);

	function goTo(index: number) {
		setActiveIndex(((index % count) + count) % count);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		if (event.key === "ArrowRight") {
			event.preventDefault();
			goTo(activeIndex + 1);
		} else if (event.key === "ArrowLeft") {
			event.preventDefault();
			goTo(activeIndex - 1);
		}
	}

	const indices = Array.from({ length: count }, (_, i) => i);

	return (
		<section
			aria-label="Image gallery"
			// biome-ignore lint/a11y/noNoninteractiveTabindex: arrow-key navigation requires the region to be focusable
			tabIndex={0}
			onKeyDown={handleKeyDown}
			className="rounded-lg border border-border bg-surface p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
		>
			<div className="relative aspect-video overflow-hidden rounded-lg bg-page">
				{indices.map((i) => (
					<img
						key={i}
						src={srcAt(i)}
						alt={`${baseAlt} — ${String(i + 1)} of ${String(count)}`}
						loading={i === 0 ? "eager" : "lazy"}
						className={`absolute inset-0 size-full object-cover transition-opacity duration-200 ease-out ${
							i === activeIndex ? "opacity-100" : "opacity-0"
						}`}
					/>
				))}
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface/80 to-transparent" />
			</div>
			{count > 1 ? (
				<div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
					{indices.map((i) => (
						<button
							key={i}
							type="button"
							onClick={() => {
								goTo(i);
							}}
							aria-label={`View photo ${String(i + 1)}`}
							aria-current={i === activeIndex ? "true" : undefined}
							className={`relative aspect-video w-20 shrink-0 overflow-hidden rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
								i === activeIndex
									? "ring-2 ring-inset ring-accent"
									: "opacity-60 hover:opacity-100"
							}`}
						>
							<img
								src={srcAt(i)}
								alt=""
								loading="lazy"
								className="size-full object-cover"
							/>
						</button>
					))}
				</div>
			) : null}
		</section>
	);
}
