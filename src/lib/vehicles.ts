export function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatMileage(mileage: number): string {
  return mileage.toLocaleString("pt-BR") + " km";
}
