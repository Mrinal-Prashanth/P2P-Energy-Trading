import React, { useEffect, useState } from "react";
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getMyWallet } from "@/lib/wallet";
import { formatCurrency } from "@/lib/energyConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

export default function WalletPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = async () => {
    const w = await base44.entities.Wallet.get(wallet.id);
    setWallet(w);
  };

  useEffect(() => {
    (async () => {
      try {
        const w = await getMyWallet();
        setWallet(w);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleTopUp = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (amt > 500) {
      toast({ title: "Maximum top-up is $500", description: "For your security, you can top up at most $500 per transaction.", variant: "destructive" });
      return;
    }
    setBusy("topup");
    try {
      await base44.entities.Wallet.update(wallet.id, { balance: (wallet.balance || 0) + amt });
      await base44.entities.Transaction.create({
        type: "topup",
        amount: amt,
        direction: "credit",
        description: "Wallet top-up",
      });
      toast({ title: "Top-up successful", description: `${formatCurrency(amt)} added to your wallet.` });
      setAmount("");
      await refresh();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast({ title: "Top-up failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (amt > (wallet.balance || 0)) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    setBusy("withdraw");
    try {
      await base44.entities.Wallet.update(wallet.id, { balance: (wallet.balance || 0) - amt });
      await base44.entities.Transaction.create({
        type: "withdrawal",
        amount: amt,
        direction: "debit",
        description: "Withdrawal to external account",
      });
      toast({ title: "Withdrawal initiated", description: `${formatCurrency(amt)} will be sent to your account.` });
      setAmount("");
      await refresh();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast({ title: "Withdrawal failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
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
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader icon={WalletIcon} title="Wallet" subtitle="Top up, withdraw, and track your funds." refreshKey={refreshKey} />

      <div className="rounded-2xl bg-white/15 p-6 text-white">
        <div className="text-sm text-white/70">Available balance</div>
        <div className="text-4xl font-bold mt-1">{formatCurrency(wallet?.balance || 0)}</div>
        <div className="text-xs text-white/60 mt-2">New accounts start with a {formatCurrency(100)} welcome balance.</div>
      </div>

      <div className="rounded-2xl bg-white/15 p-6 space-y-4 text-white">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-white/80">Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Button onClick={handleTopUp} disabled={busy === "topup"} className="gap-2 bg-white text-[#1c4d7d] hover:bg-white/90">
            <ArrowDownToLine className="w-4 h-4" />
            {busy === "topup" ? "Processing…" : "Top up wallet"}
          </Button>
          <Button onClick={handleWithdraw} disabled={busy === "withdraw"} variant="outline" className="gap-2 border-white/40 text-white bg-transparent hover:bg-white/10">
            <ArrowUpFromLine className="w-4 h-4" />
            {busy === "withdraw" ? "Processing…" : "Withdraw funds"}
          </Button>
        </div>
        <p className="text-xs text-white/60">Top-ups are capped at {formatCurrency(500)} per transaction for security. Top-ups and withdrawals are simulated for this demo marketplace.</p>
      </div>
    </div>
  );
}