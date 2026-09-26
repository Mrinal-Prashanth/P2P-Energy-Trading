import React, { useMemo, useState } from "react";
import { TrendingUp, Plus, Minus, Zap, Clock, Lightbulb, Sun, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from "recharts";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatKwh } from "@/lib/energyConfig";
import {
  PRICE_CURVE, UTILITIES, productionByHour, consumptionByHour, bestSellHour, formatHour,
} from "@/lib/energyPredictions";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const ICONS = { Fan: "Fan", Lightbulb: "Lightbulb", Wind: "Wind", Snowflake: "Snowflake", Tv: "Tv", Flame: "Flame", WashingMachine: "WashingMachine", Monitor: "Monitor", Droplet: "Droplet", Microwave: "Microwave" };

function Counter({ label, value, onAdd, onSub }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/10 p-3">
      <span className="text-sm text-white/85">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={onSub} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white"><Minus className="w-4 h-4" /></button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <button onClick={onAdd} className="w-7 h-7 rounded-full bg-white text-[#1c4d7d] flex items-center justify-center"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export default function Insights() {
  const [production, setProduction] = useState(20);
  const [rooms, setRooms] = useState(2);
  const [utilities, setUtilities] = useState([
    { key: "fan", label: "Ceiling Fan", kwh: 0.075, qty: 3 },
    { key: "light", label: "LED Light", kwh: 0.01, qty: 5 },
    { key: "fridge", label: "Refrigerator", kwh: 0.15, qty: 1 },
  ]);
  const [picker, setPicker] = useState("");

  const prodByHour = useMemo(() => productionByHour(production), [production]);
  const consByHour = useMemo(() => consumptionByHour(utilities), [utilities]);
  const excessByHour = useMemo(() => prodByHour.map((p, i) => p - consByHour[i]), [prodByHour, consByHour]);
  const best = useMemo(() => bestSellHour(excessByHour), [excessByHour]);

  const chartData = useMemo(
    () => PRICE_CURVE.map((p, i) => ({ hour: formatHour(p.hour), price: p.price, production: +prodByHour[i].toFixed(2), excess: +excessByHour[i].toFixed(2) })),
    [prodByHour, excessByHour]
  );

  const totalDailyConsumption = consByHour[0] * 24;
  const totalExcess = excessByHour.reduce((a, b) => a + Math.max(0, b), 0);

  const addUtility = () => {
    if (!picker) return;
    const u = UTILITIES.find((x) => x.key === picker);
    if (!u) return;
    setUtilities((prev) => [...prev, { key: u.key, label: u.label, kwh: u.kwh, qty: 1 }]);
    setPicker("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader icon={TrendingUp} title="Smart Sell Insights" subtitle="Predict the best time to sell your excess energy." />

      {/* Best time recommendation */}
      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5" />
          <span className="font-semibold">Recommended time to sell</span>
        </div>
        {best ? (
          <>
            <p className="text-3xl font-bold">{formatHour(best.hour)} – {formatHour(best.hour + 1)}</p>
            <p className="text-sm text-white/80 mt-1">
              Peak price <span className="font-semibold text-emerald-50">{formatCurrency(best.price)}/kWh</span> with{" "}
              <span className="font-semibold">{formatKwh(best.excess)}</span> excess available to sell.
            </p>
            <p className="text-xs text-white/60 mt-2">
              You only sell excess energy — your own usage is always covered first.
            </p>
          </>
        ) : (
          <p className="text-sm text-amber-50">
            You don't have excess energy to sell right now. Reduce utilities or increase production to start selling.
          </p>
        )}
      </div>

      {/* Price curve */}
      <div className="rounded-2xl bg-white/15 p-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" />
          <span className="font-semibold text-sm">Predicted price curve (today)</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} domain={[0, 0.4]} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "#143d6b", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, color: "#fff", fontSize: 12 }} />
              <Line type="monotone" dataKey="price" stroke="#7dd3fc" strokeWidth={2} dot={false} name="Price/kWh" />
              <Line type="monotone" dataKey="excess" stroke="#86efac" strokeWidth={2} dot={false} name="Excess kWh" />
              {best && <ReferenceDot x={formatHour(best.hour)} y={best.price} r={6} fill="#fde047" stroke="#fff" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 text-xs text-white/70 mt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7dd3fc]" /> Price/kWh</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#86efac]" /> Excess energy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fde047]" /> Best time</span>
        </div>
      </div>

      {/* Production input */}
      <div className="rounded-2xl bg-white/15 p-5 text-white space-y-3">
        <div className="flex items-center gap-2"><Sun className="w-4 h-4" /><span className="font-semibold text-sm">Your daily production</span></div>
        <div className="flex items-center gap-3">
          <input type="range" min="0" max="60" step="1" value={production} onChange={(e) => setProduction(Number(e.target.value))} className="flex-1 accent-white" />
          <span className="font-bold w-24 text-right">{formatKwh(production)}/day</span>
        </div>
      </div>

      {/* Consumption calculator */}
      <div className="rounded-2xl bg-white/15 p-5 text-white space-y-3">
        <div className="flex items-center gap-2"><Lightbulb className="w-4 h-4" /><span className="font-semibold text-sm">Your household consumption</span></div>

        <Counter label="Number of rooms" value={rooms} onAdd={() => setRooms((r) => r + 1)} onSub={() => setRooms((r) => Math.max(0, r - 1))} />

        <div className="space-y-2">
          {utilities.map((u, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-white/10 p-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{u.label}</div>
                <div className="text-xs text-white/60">{formatKwh(u.kwh)}/hr each</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setUtilities((p) => p.map((x, j) => (j === i ? { ...x, qty: Math.max(0, x.qty - 1) } : x)))} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                <span className="w-5 text-center text-sm font-semibold">{u.qty}</span>
                <button onClick={() => setUtilities((p) => p.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x)))} className="w-7 h-7 rounded-full bg-white text-[#1c4d7d] flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                <button onClick={() => setUtilities((p) => p.filter((_, j) => j !== i))} className="ml-1 text-white/50 hover:text-rose-200"><X /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select value={picker} onChange={(e) => setPicker(e.target.value)} className="flex-1 rounded-xl bg-white/20 border border-white/30 px-2 py-2 text-sm text-white outline-none">
            <option value="" className="text-black">Add a utility…</option>
            {UTILITIES.map((u) => <option key={u.key} value={u.key} className="text-black">{u.label} ({formatKwh(u.kwh)}/hr)</option>)}
          </select>
          <Button onClick={addUtility} disabled={!picker} className="bg-white text-[#1c4d7d] hover:bg-white/90 gap-1"><Plus className="w-4 h-4" /> Add</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl bg-white/15 p-5 text-white space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-white/70">Daily production</span><span className="font-medium">{formatKwh(production)}</span></div>
        <div className="flex justify-between"><span className="text-white/70">Daily consumption ({rooms} rooms)</span><span className="font-medium">{formatKwh(totalDailyConsumption)}</span></div>
        <div className="flex justify-between border-t border-white/15 pt-2"><span className="font-medium">Total excess to sell</span><span className="font-bold text-emerald-50">{formatKwh(totalExcess)}</span></div>
        {best && (
          <div className="flex justify-between"><span className="text-white/70">Est. earnings at peak</span><span className="font-semibold">{formatCurrency(totalExcess * best.price)}</span></div>
        )}
      </div>
    </div>
  );
}