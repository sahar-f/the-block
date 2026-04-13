const currencyFormatter = new Intl.NumberFormat("en-CA", {
	style: "currency",
	currency: "CAD",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-CA");

export function formatCurrency(amount: number): string {
	return currencyFormatter.format(amount);
}

export function formatOdometer(km: number): string {
	return `${numberFormatter.format(km)} km`;
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-CA", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
