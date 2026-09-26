import React, { useEffect, useState, useMemo } from "react";
import { Receipt, ArrowDownLeft, ArrowUpLeft, Check, X, MapPin, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { acceptOffer, rejectOffer } from "@/lib/tradeActions";
import { formatCurrency } from "@/lib/energyConfig";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

const typeLabels = {
  topup: "Top-up",
  withdrawal: "Withdrawal",
  trade_purchase: "Energy request",
  trade_sale: "Energy sale",
};

const approvalBadge = (s) =>
  s === "approved" ? "bg-emerald-400/30 text-emerald-50" : s === "rejected" ? "bg-rose-400/30 text-rose-50" : "bg-amber-400/30 text-amber-50";

export default function Transactions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [txns, setTxns] = useState([]);
  const [pending, setPending] = useState([]);
  const [me, setMe] = useState(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const user = await base44.auth.me();
    setMe(user);
    const allTxns = await base44.entities.Transaction.list("-created_date", 500);
    const myTxns = allTxns.filter((t) => t.created_by_id === user.id);
    const allListings = await base44.entities.Listing.list("-created_date", 500);
    const myListingIds = new Set(allListings.filter((l) => l.created_by_id === user.id).map((l) => l.id));
    const pendingReqs = allTxns.filter((t) => t.type === "trade_purchase" && t.approval_status === "waiting" && myListingIds.has(t.listing_id));
    const sales = allListings
      .filter((l) => l.created_by_id === user.id && l.status === "sold")
      .map((l) => ({
        id: `sale-${l.id}`,
        type: "trade_sale",
        amount: l.amount_kwh * l.rate_per_kwh,
        direction: "credit",
        description: `Sold ${l.amount_kwh} kWh "${l.title}"`,
        counterparty_name: l.buyer_name || "Buyer",
        kwh: l.amount_kwh,
        created_date: l.updated_date || l.created_date,
        approval_status: "approved",
        transfer_status: "full_transmitted",
      }));

    const merged = [...myTxns, ...sales].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setTxns(merged);
    setPending(pendingReqs);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return txns;
    return txns.filter((t) => t.type === filter);
  }, [txns, filter]);

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

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader icon={Receipt} title="Track" subtitle="Your energy requests, transfers, and history." />

      {/* Pending seller approvals */}
      {pending.length > 0 && (
        <div className="rounded-2xl bg-amber-400/15 border border-amber-300/30 p-4">
          <h2 className="font-semibold text-white mb-1">Pending Seller Approvals</h2>
          <p className="text-xs text-white/70 mb-3">Incoming buy requests awaiting your approval.</p>
          <div className="flex flex-col gap-2.5">
            {pending.map((p) => (
              <div key={p.id} className="rounded-xl bg-white/15 p-3 text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{p.description}</div>
                    <div className="text-xs text-white/60">From {p.buyer_name || "a buyer"} · {formatCurrency(p.amount)} · {p.kwh} kWh</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-50">waiting</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => handleAccept(p)} disabled={busy} className="flex-1 bg-white text-[#1c4d7d] hover:bg-white/90 gap-1">
                    <Check className="w-4 h-4" /> Accept
                  </Button>
                  <Button onClick={() => handleReject(p)} disabled={busy} variant="outline" className="flex-1 border-white/40 text-white bg-transparent hover:bg-white/10 gap-1">
                    <X className="w-4 h-4" /> Reject
                  </Button>
                  <Link to={`/track/${p.id}`} className="flex items-center justify-center gap-1 px-3 rounded-xl border border-white/40 text-white hover:bg-white/10 text-xs">
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-full bg-white/10 border-white/40 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All transactions</SelectItem>
          <SelectItem value="topup">Top-ups</SelectItem>
          <SelectItem value="withdrawal">Withdrawals</SelectItem>
          <SelectItem value="trade_purchase">Energy requests</SelectItem>
          <SelectItem value="trade_sale">Sales</SelectItem>
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/70 rounded-2xl bg-white/10">
          <Receipt className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No transactions yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((t) => {
            const isCredit = t.direction === "credit";
            const isPurchase = t.type === "trade_purchase";
            return (
              <div key={t.id} className="rounded-2xl bg-white/15 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? "bg-emerald-400/30" : "bg-rose-400/30"}`}>
                    {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpLeft className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{t.description || typeLabels[t.type] || t.type}</div>
                    <div className="text-xs text-white/60">
                      {typeLabels[t.type] || t.type}
                      {t.counterparty_name ? ` · ${t.counterparty_name}` : ""}
                      {" · "}{new Date(t.created_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold text-sm ${isCredit ? "text-emerald-50" : "text-rose-50"}`}>
                      {isCredit ? "+" : "−"}{formatCurrency(t.amount)}
                    </div>
                    {isPurchase && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${approvalBadge(t.approval_status)}`}>
                        {t.approval_status}
                      </span>
                    )}
                  </div>
                </div>

                {isPurchase && (
                  <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2">
                    <Link to={`/track/${t.id}`} className="flex-1 flex items-center justify-center gap-1 text-xs text-white/80 hover:text-white">
                      <MapPin className="w-3.5 h-3.5" /> Track transfer
                    </Link>
                    {t.approval_status === "waiting" && (
                      <button onClick={() => handleReject(t)} disabled={busy} className="text-xs text-rose-200 hover:text-rose-100 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Cancel offer
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}