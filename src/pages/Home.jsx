import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Store, TrendingUp, Wallet as WalletIcon, ArrowRight, LogOut, ListOrdered, Receipt, Plus, Leaf } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getMyWallet } from "@/lib/wallet";
import { formatCurrency, formatKwh, GOV_BUY_RATE, GOV_SELL_RATE } from "@/lib/energyConfig";
import PageHeader from "@/components/PageHeader";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState({ openListings: 0, myPurchases: 0, mySales: 0, transmittedKwh: 0, p2pEarnings: 0, myOpenListings: [] });
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setMe(user);
        const w = await getMyWallet();
        setWallet(w);

        const allListings = await base44.entities.Listing.list("-created_date", 500);
        const openCount = allListings.filter((l) => l.status === "open").length;
        const mySold = allListings.filter((l) => l.status === "sold" && l.created_by_id === user.id);
        const transmittedKwh = mySold.reduce((s, l) => s + (l.amount_kwh || 0), 0);
        const p2pEarnings = mySold.reduce((s, l) => s + (l.amount_kwh || 0) * (l.rate_per_kwh || 0), 0);
        const myOpenListings = allListings.filter((l) => l.status === "open" && l.created_by_id === user.id);

        const txns = await base44.entities.Transaction.filter({ created_by_id: user.id });
        const myPurchases = txns.filter((t) => t.type === "trade_purchase").length;

        setStats({ openListings: openCount, myPurchases, mySales: mySold.length, transmittedKwh, p2pEarnings, myOpenListings });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const gridEarnings = stats.transmittedKwh * GOV_BUY_RATE;
  const hasSales = stats.transmittedKwh > 0;

  const statCards = [
    { icon: WalletIcon, label: "Wallet Balance", value: formatCurrency(wallet?.balance || 0) },
    { icon: Store, label: "Open Listings", value: stats.openListings },
    { icon: TrendingUp, label: "Energy Purchased", value: stats.myPurchases },
    { icon: Zap, label: "Energy Sold", value: stats.mySales },
  ];

  const actions = [
    { to: "/marketplace", label: "Browse Marketplace", icon: Store },
    { to: "/wallet", label: "Top up your wallet", icon: WalletIcon },
    { to: "/my-listings", label: "My listings", icon: ListOrdered },
    { to: "/transactions", label: "Transaction history", icon: Receipt },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        icon={Zap}
        title={`Welcome back${me?.full_name ? `, ${me.full_name}` : ""}`}
        subtitle="Trade surplus energy directly with peers."
      />

      {/* Marketing banner */}
      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Leaf className="w-5 h-5" />
          <span className="font-semibold">{hasSales ? "Your Clean Energy Impact" : "Earn More Than the Grid"}</span>
        </div>
        {hasSales ? (
          <p className="text-white/80 text-sm">
            You transmitted <span className="font-bold text-white">{formatKwh(stats.transmittedKwh)}</span> of clean energy. At grid feed-in rates you'd have earned{" "}
            <span className="line-through text-white/60">{formatCurrency(gridEarnings)}</span> — on VoltShare you earned{" "}
            <span className="font-bold text-emerald-50">{formatCurrency(stats.p2pEarnings)}</span>.
          </p>
        ) : (
          <>
            <p className="text-white/80 text-sm">
              The grid pays you {formatCurrency(GOV_BUY_RATE)}/kWh for surplus energy. Sell peer-to-peer and earn up to{" "}
              {formatCurrency(GOV_SELL_RATE)}/kWh — neighbors save, you profit.
            </p>
            <Link to="/sell" className="inline-flex items-center gap-2 mt-3 rounded-full bg-white text-[#1c4d7d] px-4 py-2 text-sm font-semibold">
              List your energy
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-white/15 p-4 text-white">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold leading-tight">{s.value}</div>
              <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Your Listings */}
      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Your Listings</h2>
          <Link to="/sell" className="flex items-center gap-1 text-sm text-white/90 hover:text-white bg-white/20 rounded-full px-3 py-1.5">
            <Plus className="w-4 h-4" /> Add new
          </Link>
        </div>
        {stats.myOpenListings.length === 0 ? (
          <p className="text-sm text-white/60">
            No open listings yet. <Link to="/sell" className="underline">Add one</Link> to start earning.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.myOpenListings.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl bg-white/10 p-3">
                <div>
                  <div className="font-medium text-sm">{l.title}</div>
                  <div className="text-xs text-white/60">{formatKwh(l.amount_kwh)} · {formatCurrency(l.rate_per_kwh)}/kWh</div>
                </div>
                <Link to="/my-listings" className="text-xs text-white/80 hover:text-white">Manage</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <h2 className="font-semibold mb-3">How pricing works</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-white/15">
            <span className="text-white/70">BESCOM feed-in (sell to grid)</span>
            <span className="font-medium">{formatCurrency(GOV_BUY_RATE)}/kWh</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/15">
            <span className="text-white/70">BESCOM retail (buy from grid)</span>
            <span className="font-medium">{formatCurrency(GOV_SELL_RATE)}/kWh</span>
          </div>
          <div className="flex justify-between items-center text-emerald-50">
            <span className="font-medium">Tradeable spread</span>
            <span className="font-bold">{formatCurrency(GOV_SELL_RATE - GOV_BUY_RATE)}/kWh</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <h2 className="font-semibold mb-3">Quick actions</h2>
        <div className="flex flex-col gap-1">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.to} to={a.to} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors">
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Icon className="w-4 h-4" />
                  {a.label}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors text-left">
            <span className="flex items-center gap-3 text-sm font-medium">
              <LogOut className="w-4 h-4" />
              Sign out
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}