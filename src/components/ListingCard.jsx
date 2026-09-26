import React from "react";
import { Sun, Wind, Droplet, Battery, Leaf } from "lucide-react";
import { formatCurrency, formatKwh, GOV_SELL_RATE } from "@/lib/energyConfig";
import { Button } from "@/components/ui/button";

const typeIcons = {
  Solar: Sun,
  Wind: Wind,
  Hydro: Droplet,
  "Battery Storage": Battery,
  Biogas: Leaf,
};

export default function ListingCard({ listing, onBuy, buying, owned, showSeller = true }) {
  const Icon = typeIcons[listing.energy_type] || Sun;
  const total = (listing.amount_kwh || 0) * (listing.rate_per_kwh || 0);
  const savings = (GOV_SELL_RATE - listing.rate_per_kwh) * (listing.amount_kwh || 0);
  const isMine = owned;

  return (
    <div className="rounded-2xl bg-white/15 p-4 flex flex-col gap-3 text-white">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold leading-tight">{listing.title}</div>
            <div className="text-xs text-white/70">{listing.energy_type}</div>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            listing.status === "open"
              ? "bg-emerald-400/30 text-emerald-50"
              : listing.status === "sold"
              ? "bg-white/20 text-white/70"
              : "bg-amber-400/30 text-amber-50"
          }`}
        >
          {listing.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-white/60">Volume</div>
          <div className="font-medium">{formatKwh(listing.amount_kwh)}</div>
        </div>
        <div>
          <div className="text-xs text-white/60">Rate</div>
          <div className="font-medium">{formatCurrency(listing.rate_per_kwh)}/kWh</div>
          <div className="text-xs text-white/50 line-through">BESCOM {formatCurrency(GOV_SELL_RATE)}</div>
        </div>
        <div>
          <div className="text-xs text-white/60">Total</div>
          <div className="font-semibold">{formatCurrency(total)}</div>
        </div>
        <div>
          <div className="text-xs text-white/60">Available</div>
          <div className="font-medium">{listing.available_from || "—"}–{listing.available_to || ""}</div>
        </div>
      </div>

      {listing.status === "open" && !isMine && (
        <div className="text-xs text-emerald-50 bg-emerald-400/20 rounded-md px-2 py-1.5">
          Buyer saves {formatCurrency(savings)} vs BESCOM
        </div>
      )}

      {onBuy && listing.status === "open" && !isMine && (
        <Button onClick={() => onBuy(listing)} disabled={buying} className="w-full bg-white text-[#1c4d7d] hover:bg-white/90">
          {buying ? "Processing…" : `Buy for ${formatCurrency(total)}`}
        </Button>
      )}
      {isMine && listing.status === "open" && (
        <div className="text-xs text-white/70 text-center bg-white/10 rounded-md py-1.5">Your listing</div>
      )}
    </div>
  );
}