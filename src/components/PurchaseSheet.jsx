import React, { useState } from "react";
import { X, User, ShoppingBag, Gavel } from "lucide-react";
import { formatCurrency, formatKwh, GOV_SELL_RATE } from "@/lib/energyConfig";
import { Button } from "@/components/ui/button";

export default function PurchaseSheet({ listing, highestOffer = 0, onClose, onConfirm, busy }) {
  const [qty, setQty] = useState(listing.amount_kwh);
  const max = listing.amount_kwh || 0;
  const quantity = Math.max(0, Math.min(Number(qty) || 0, max));
  const total = quantity * (listing.rate_per_kwh || 0);
  const bescomCost = quantity * GOV_SELL_RATE;
  const savings = bescomCost - total;
  const mustBeat = highestOffer > 0 && total <= highestOffer;
  const canBuy = quantity > 0 && quantity <= max && !mustBeat;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md mb-16 rounded-t-3xl bg-[#143d6b]/95 backdrop-blur-md border-t border-white/20 p-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold">{listing.seller_name || listing.title}</div>
              <div className="text-sm text-white/70">{listing.energy_type} · {formatKwh(max)} available</div>
              <div className="text-xs text-white/60">Available {listing.available_from || "—"}–{listing.available_to || ""}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {highestOffer > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-400/20 border border-amber-300/30 px-3 py-2 mb-3 text-sm">
            <Gavel className="w-4 h-4 text-amber-100" />
            <span className="text-amber-50">Highest offer so far: <span className="font-semibold">{formatCurrency(highestOffer)}</span>. Add more to win.</span>
          </div>
        )}

        <div className="space-y-1.5 mb-4">
          <label className="text-sm text-white/80">Quantity to offer (kWh)</label>
          <div className="flex items-center rounded-xl bg-white/20 border border-white/30 px-3">
            <input
              type="number"
              min="1"
              max={max}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="flex-1 bg-transparent py-2.5 outline-none text-white placeholder:text-white/60 w-full"
            />
            <span className="text-sm text-white/70">kWh</span>
          </div>
          <p className="text-xs text-white/60">Max available: {formatKwh(max)}</p>
          {mustBeat && (
            <p className="text-xs text-amber-200">Your offer ({formatCurrency(total)}) must beat the current highest offer.</p>
          )}
        </div>

        <div className="rounded-xl bg-white/10 p-4 space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-white/70">Quantity</span>
            <span className="font-medium">{formatKwh(quantity)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">P2P price / kWh</span>
            <span className="font-medium">{formatCurrency(listing.rate_per_kwh)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">BESCOM cost (grid)</span>
            <span className="text-white/50 line-through">{formatCurrency(bescomCost)}</span>
          </div>
          <div className="flex justify-between border-t border-white/15 pt-2">
            <span className="font-medium">Your offer</span>
            <span className="font-bold text-lg">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-emerald-50">
            <span className="text-sm">You save vs BESCOM</span>
            <span className="font-semibold text-sm">{formatCurrency(savings)}</span>
          </div>
        </div>

        <Button
          disabled={!canBuy || busy}
          onClick={() => onConfirm(quantity)}
          className="w-full bg-white text-[#1c4d7d] hover:bg-white/90 gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          {busy ? "Sending offer…" : highestOffer > 0 ? "Beat the current offer" : "Make an offer"}
        </Button>
      </div>
    </div>
  );
}