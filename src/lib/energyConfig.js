export const GOV_BUY_RATE = 0.08; // BESCOM feed-in tariff (what the grid pays producers) per kWh
export const GOV_SELL_RATE = 0.32; // BESCOM retail rate (what consumers pay the grid) per kWh

export const ENERGY_TYPES = ["Solar", "Wind", "Hydro", "Battery Storage", "Biogas"];

export function formatCurrency(value) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatKwh(value) {
  return `${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} kWh`;
}