import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, TrendingUp, Zap, Users, AlertTriangle, MapPin, Check, X, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatKwh } from "@/lib/energyConfig";
import { PRICE_CURVE, demandLevel, formatHour } from "@/lib/energyPredictions";
import { acceptOffer, rejectOffer } from "@/lib/tradeActions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

export default function Notifications() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [notes, setNotes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const user = await base44.auth.me();
    setMe(user);
    const allListings = await base44.entities.Listing.list("-created_date", 500);
    const allTxns = await base44.entities.Transaction.list("-created_date", 500);

    // Requests on the current user's listings (seller view) — waiting or approved.
    const myListingIds = new Set(allListings.filter((l) => l.created_by_id === user.id).map((l) => l.id));
    const sellerReqs = allTxns
      .filter((t) => t.type === "trade_purchase" && myListingIds.has(t.listing_id) && t.approval_status !== "rejected")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setRequests(sellerReqs);

    // Per-seller stats: open energy listed + profit from sold listings.
    const bySeller = {};
    allListings.forEach((l) => {
      const id = l.created_by_id;
      if (!bySeller[id]) bySeller[id] = { name: l.seller_name || "Neighbour", openKwh: 0, profit: 0 };
      bySeller[id].name = l.seller_name || bySeller[id].name;
      if (l.status === "open") bySeller[id].openKwh += l.amount_kwh || 0;
      if (l.status === "sold") bySeller[id].profit += (l.amount_kwh || 0) * (l.rate_per_kwh || 0);
    });

    const myStats = bySeller[user.id] || { name: user.full_name || "You", openKwh: 0, profit: 0 };
    const neighbours = Object.entries(bySeller).filter(([id]) => id !== user.id);
    const top = neighbours.sort((a, b) => (b[1].profit + b[1].openKwh) - (a[1].profit + a[1].openKwh))[0];

    const list = [];

    const now = new Date();
    const hour = now.getHours();
    const d = demandLevel(hour);
    if (d.level === "high") {
      list.push({
        icon: AlertTriangle, tone: "amber",
        title: "High energy demand right now",
        body: `Demand peaks around ${formatHour(hour)}. It's a great time to list energy at a premium rate — buyers pay more.`,
      });
    } else if (d.level === "medium") {
      list.push({
        icon: TrendingUp, tone: "sky",
        title: "Demand is rising",
        body: `Demand is medium at ${formatHour(hour)}. Evening peak (5–9 PM) offers the highest prices.`,
      });
    }

    if (top) {
      const n = top[1];
      const moreKwh = Math.max(0, n.openKwh - myStats.openKwh);
      const moreProfit = Math.max(0, n.profit - myStats.profit);
      list.push({
        icon: Users, tone: "emerald",
        title: `Your neighbour ${n.name} is ahead`,
        body: `${n.name} has ${formatKwh(moreKwh)} more energy listed and has earned ${formatCurrency(moreProfit)} more profit than you in your area. List your excess energy to catch up!`,
      });
    } else {
      list.push({
        icon: Users, tone: "emerald",
        title: "You're the only seller nearby",
        body: "No neighbours are selling yet — be the first to list your excess energy and earn.",
      });
    }

    const peak = PRICE_CURVE.reduce((a, b) => (b.price > a.price ? b : a), PRICE_CURVE[0]);
    list.push({
      icon: Zap, tone: "sky",
      title: "Best time to sell today",
      body: `Prices peak at ${formatHour(peak.hour)} (${formatCurrency(peak.price)}/kWh). Open Smart Sell Insights to plan your sale.`,
    });

    setNotes(list);
  };

  useEffect(() => {
    (async () => {
      try { await load(); } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const handleAccept = async (order) => {
    setBusy(true);
    try {
      const res = await acceptOffer(order);
      if (!res.ok) {
        toast({ title: "Buyer has insufficient balance", description: "This order cannot be completed yet.", variant: "destructive" });
        return;
      }
      toast({ title: "Order approved", description: `${formatCurrency(order.amount)} transferred to you. ${res.aborted} other offer(s) aborted.` });
      await load();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (order) => {
    setBusy(true);
    try {
      await rejectOffer(order);
      toast({ title: "Offer rejected", description: "The transfer has been aborted." });
      await load();
    } catch (e) {
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const toneClasses = {
    amber: "bg-amber-400/20 border-amber-300/30",
    sky: "bg-sky-400/20 border-sky-300/30",
    emerald: "bg-emerald-400/20 border-emerald-300/30",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader icon={Bell} title="Notifications" subtitle="Stay ahead of your neighbours and the market." />

      {/* Requests on your listings — seller can approve / reject / chat */}
      {requests.length > 0 && (
        <div className="rounded-2xl bg-amber-400/15 border border-amber-300/30 p-4">
          <h2 className="font-semibold text-white mb-1">Requests on your listings</h2>
          <p className="text-xs text-white/70 mb-3">Approve, reject, or open a chat with the buyer.</p>
          <div className="flex flex-col gap-2.5">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl bg-white/15 p-3 text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{r.description}</div>
                    <div className="text-xs text-white/60">From {r.buyer_name || "a buyer"} · {formatCurrency(r.amount)} · {r.kwh} kWh</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${r.approval_status === "waiting" ? "bg-amber-400/30 text-amber-50" : "bg-emerald-400/30 text-emerald-50"}`}>
                    {r.approval_status}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  {r.approval_status === "waiting" && (
                    <>
                      <Button onClick={() => handleAccept(r)} disabled={busy} size="sm" className="flex-1 bg-white text-[#1c4d7d] hover:bg-white/90 gap-1">
                        <Check className="w-4 h-4" /> Accept
                      </Button>
                      <Button onClick={() => handleReject(r)} disabled={busy} size="sm" variant="outline" className="flex-1 border-white/40 text-white bg-transparent hover:bg-white/10 gap-1">
                        <X className="w-4 h-4" /> Reject
                      </Button>
                    </>
                  )}
                  <Link
                    to={`/track/${r.id}`}
                    className={`flex items-center justify-center gap-1 px-3 rounded-xl bg-white/20 text-white hover:bg-white/30 text-xs ${r.approval_status === "waiting" ? "" : "flex-1 py-2"}`}
                  >
                    <MessageSquare className="w-4 h-4" /> Enter chat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-white/70 rounded-xl bg-white/10 px-3 py-2">
        <MapPin className="w-3.5 h-3.5" /> Based on your area and the live demand curve.
      </div>

      <div className="flex flex-col gap-3">
        {notes.map((n, i) => {
          const Icon = n.icon;
          return (
            <div key={i} className={`rounded-2xl border p-4 text-white ${toneClasses[n.tone]}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{n.title}</div>
                  <p className="text-sm text-white/80 mt-1">{n.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}