// Predicted energy price & demand curve (24h), utility consumption presets, and helpers.
// Values are illustrative INR-equivalent USD per kWh, shaped like a real daily demand curve:
// low overnight, a solar dip midday, and a sharp evening peak.

export const PRICE_CURVE = [
  { hour: 0, price: 0.1, demand: 0.2 },
  { hour: 1, price: 0.09, demand: 0.18 },
  { hour: 2, price: 0.09, demand: 0.17 },
  { hour: 3, price: 0.09, demand: 0.17 },
  { hour: 4, price: 0.1, demand: 0.19 },
  { hour: 5, price: 0.11, demand: 0.24 },
  { hour: 6, price: 0.14, demand: 0.35 },
  { hour: 7, price: 0.18, demand: 0.5 },
  { hour: 8, price: 0.2, demand: 0.58 },
  { hour: 9, price: 0.19, demand: 0.55 },
  { hour: 10, price: 0.17, demand: 0.48 },
  { hour: 11, price: 0.16, demand: 0.45 },
  { hour: 12, price: 0.15, demand: 0.43 },
  { hour: 13, price: 0.15, demand: 0.42 },
  { hour: 14, price: 0.16, demand: 0.45 },
  { hour: 15, price: 0.18, demand: 0.52 },
  { hour: 16, price: 0.22, demand: 0.66 },
  { hour: 17, price: 0.27, demand: 0.8 },
  { hour: 18, price: 0.33, demand: 0.95 },
  { hour: 19, price: 0.34, demand: 1.0 },
  { hour: 20, price: 0.3, demand: 0.88 },
  { hour: 21, price: 0.24, demand: 0.7 },
  { hour: 22, price: 0.18, demand: 0.5 },
  { hour: 23, price: 0.13, demand: 0.32 },
];

export const PEAK_HOURS = [17, 18, 19, 20, 21];

// Solar generation profile (weights per hour), peaking at noon.
const SOLAR_PROFILE = [
  0, 0, 0, 0, 0, 0, 0.04, 0.12, 0.22, 0.32, 0.4, 0.46, 0.48, 0.46, 0.4, 0.32, 0.22, 0.12, 0.04, 0, 0, 0, 0, 0,
];
const SOLAR_SUM = SOLAR_PROFILE.reduce((a, b) => a + b, 0);

export function productionByHour(totalKwh) {
  const total = Number(totalKwh) || 0;
  return SOLAR_PROFILE.map((w) => (total * w) / SOLAR_SUM);
}

export const UTILITIES = [
  { key: "fan", label: "Ceiling Fan", kwh: 0.075, icon: "Fan" },
  { key: "light", label: "LED Light", kwh: 0.01, icon: "Lightbulb" },
  { key: "ac", label: "Air Conditioner", kwh: 1.5, icon: "Wind" },
  { key: "fridge", label: "Refrigerator", kwh: 0.15, icon: "Snowflake" },
  { key: "tv", label: "Television", kwh: 0.1, icon: "Tv" },
  { key: "heater", label: "Water Heater", kwh: 2.0, icon: "Flame" },
  { key: "washer", label: "Washing Machine", kwh: 0.5, icon: "WashingMachine" },
  { key: "computer", label: "Computer", kwh: 0.1, icon: "Monitor" },
  { key: "pump", label: "Water Pump", kwh: 0.4, icon: "Droplet" },
  { key: "oven", label: "Microwave / Oven", kwh: 1.2, icon: "Microwave" },
];

// Hourly consumption = sum of (utility.kwh * quantity), assumed constant across hours.
export function consumptionByHour(utilities) {
  const perHour = utilities.reduce((sum, u) => sum + (Number(u.kwh) || 0) * (Number(u.qty) || 0), 0);
  return Array.from({ length: 24 }, () => perHour);
}

// Best hour to sell = highest price among hours where excess energy is available.
export function bestSellHour(excessByHour) {
  let best = null;
  PRICE_CURVE.forEach((p, i) => {
    if ((excessByHour[i] || 0) > 0) {
      if (!best || p.price > best.price) best = { hour: p.hour, price: p.price, excess: excessByHour[i] };
    }
  });
  return best;
}

export function demandLevel(hour) {
  const p = PRICE_CURVE[hour]?.price || 0;
  if (p >= 0.27) return { level: "high", label: "High", color: "text-rose-200" };
  if (p >= 0.18) return { level: "medium", label: "Medium", color: "text-amber-200" };
  return { level: "low", label: "Low", color: "text-emerald-200" };
}

export function formatHour(h) {
  return `${String(h).padStart(2, "0")}:00`;
}