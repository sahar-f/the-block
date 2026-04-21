import { AlertCircle } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router";

type ErrorBoundaryProps = {
	children: ReactNode;
};

type ErrorBoundaryState = {
	hasError: boolean;
};

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		if (import.meta.env.DEV) {
			console.error("ErrorBoundary caught:", error, info.componentStack);
		}
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="mx-auto flex min-h-[60vh] max-w-screen-2xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-10 xl:px-12">
					<AlertCircle aria-hidden="true" className="mb-4 size-12 text-error" />
					<h1 className="font-heading text-xl font-semibold text-text-primary">
						Something went wrong
					</h1>
					<p className="mt-2 text-sm text-text-secondary">
						An unexpected error occurred. Please try again.
					</p>
					<Link
						to="/"
						className="bg-accent-gradient mt-6 inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
					>
						Browse all vehicles
					</Link>
				</div>
			);
		}
		return this.props.children;
	}
}
