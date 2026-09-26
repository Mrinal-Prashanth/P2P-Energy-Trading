import React, { useEffect, useState, useMemo } from "react";
import { Store, Search, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatKwh, GOV_SELL_RATE } from "@/lib/energyConfig";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import PurchaseSheet from "@/components/PurchaseSheet";

const timeToMins = (t) => {
  if (!t) return 9999;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export default function Marketplace() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [me, setMe] = useState(null);
  const [selected, setSelected] = useState(null);
  const [highestOffer, setHighestOffer] = useState(0);
  const [buying, setBuying] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("price_desc");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = async () => {
    const all = await base44.entities.Listing.list("-created_date", 500);
    setListings(all);
  };

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setMe(user);
        await load();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openSheet = async (listing) => {
    setSelected(listing);
    try {
      const offers = await base44.entities.Transaction.filter({ listing_id: listing.id, type: "trade_purchase", approval_status: "waiting" }, "-created_date", 100);
      const top = offers.reduce((max, t) => Math.max(max, t.amount || 0), 0);
      setHighestOffer(top);
    } catch (e) {
      setHighestOffer(0);
    }
  };

  const filtered = useMemo(() => {
    let result = listings.filter((l) => l.status === "open" && l.created_by_id !== me?.id);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => (l.seller_name || l.title || "").toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "price_desc": return b.rate_per_kwh - a.rate_per_kwh;
        case "price_asc": return a.rate_per_kwh - b.rate_per_kwh;
        case "energy_desc": return b.amount_kwh - a.amount_kwh;
        case "energy_asc": return a.amount_kwh - b.amount_kwh;
        case "time_asc": return timeToMins(a.available_from) - timeToMins(b.available_from);
        case "time_desc": return timeToMins(b.available_from) - timeToMins(a.available_from);
        default: return 0;
      }
    });
    return result;
  }, [listings, search, sortBy, me]);

  const handleRequest = async (quantity) => {
    const listing = selected;
    const qty = Number(quantity) || 0;
    if (!listing || qty <= 0 || qty > listing.amount_kwh) return;
    const total = qty * listing.rate_per_kwh;
    if (highestOffer > 0 && total <= highestOffer) {
      toast({ title: "Offer too low", description: `Another offer of ${formatCurrency(highestOffer)} already exists. Add more to your offer to compete.`, variant: "destructive" });
      return;
    }
    setBuying(true);
    try {
      await base44.entities.Transaction.create({
        type: "trade_purchase",
        amount: total,
        direction: "debit",
        description: `Offered ${qty} kWh for "${listing.title}"`,
        counterparty_name: listing.seller_name || "Seller",
        buyer_name: me?.full_name || me?.email || "Buyer",
        listing_id: listing.id,
        kwh: qty,
        approval_status: "waiting",
        transfer_status: "yet_to_transmit",
      });
      toast({ title: "Offer sent", description: `Your offer of ${formatCurrency(total)} is awaiting the seller's approval.` });
      setRefreshKey((k) => k + 1);
      setSelected(null);
    } catch (e) {
      console.error(e);
      toast({ title: "Offer failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader icon={Store} title="Energy Marketplace" subtitle="Buy. Sell. Support a Cleaner Tomorrow." refreshKey={refreshKey} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-xl bg-white/20 placeholder:text-white/70 text-white pl-9 pr-3 py-2.5 outline-none focus:bg-white/25 transition-colors"
        />
      </div>

      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-full bg-white/10 border-white/40 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="price_desc">Price: High → Low</SelectItem>
          <SelectItem value="price_asc">Price: Low → High</SelectItem>
          <SelectItem value="energy_desc">Energy: Highest → Lowest</SelectItem>
          <SelectItem value="energy_asc">Energy: Lowest → Highest</SelectItem>
          <SelectItem value="time_asc">Time: Earliest available</SelectItem>
          <SelectItem value="time_desc">Time: Latest available</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/70">No listings match your search.</div>
        ) : (
          filtered.map((l) => {
            const savingsPct = Math.round((1 - l.rate_per_kwh / GOV_SELL_RATE) * 100);
            return (
              <button
                key={l.id}
                onClick={() => openSheet(l)}
                className="w-full flex items-center gap-3 rounded-2xl bg-white/15 p-3.5 text-left transition-colors hover:bg-white/20"
              >
                <div className="w-11 h-11 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{l.seller_name || l.title}</div>
                  <div className="text-sm text-white/70">{formatKwh(l.amount_kwh)} · {l.available_from || "—"}–{l.available_to || ""}</div>
                  <div className="text-xs text-emerald-50 mt-0.5">{savingsPct}% vs BESCOM</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-white">{formatCurrency(l.rate_per_kwh)}/kWh</div>
                  <div className="text-xs text-white/50 line-through">{formatCurrency(GOV_SELL_RATE)}</div>
                  <div className="text-xs text-white/60">Tap to offer</div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selected && (
        <PurchaseSheet
          listing={selected}
          highestOffer={highestOffer}
          busy={buying}
          onClose={() => setSelected(null)}
          onConfirm={handleRequest}
        />
      )}
    </div>
  );
}