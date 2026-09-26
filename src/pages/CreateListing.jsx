import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { ENERGY_TYPES, GOV_BUY_RATE, GOV_SELL_RATE, formatCurrency } from "@/lib/energyConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

const HOURS = ["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];

export default function CreateListing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", energy_type: "Solar", amount_kwh: "", rate_per_kwh: "", available_from: "09:00", available_to: "17:00" });
  const [submitting, setSubmitting] = useState(false);

  const rate = Number(form.rate_per_kwh) || 0;
  const kwh = Number(form.amount_kwh) || 0;
  const total = rate * kwh;
  const rateValid = rate >= GOV_BUY_RATE && rate <= GOV_SELL_RATE;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !kwh || !rate) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (!rateValid) {
      toast({ title: "Rate out of range", description: `Rate must be between ${formatCurrency(GOV_BUY_RATE)} and ${formatCurrency(GOV_SELL_RATE)} per kWh.`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.Listing.create({
        title: form.title,
        energy_type: form.energy_type,
        amount_kwh: kwh,
        rate_per_kwh: rate,
        status: "open",
        seller_name: me?.full_name || me?.email || "Producer",
        available_from: form.available_from,
        available_to: form.available_to,
      });
      toast({ title: "Listing created", description: "Your energy is now live on the marketplace." });
      navigate("/my-listings");
    } catch (err) {
      console.error(err);
      toast({ title: "Could not create listing", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader icon={PlusCircle} title="Sell Energy" subtitle="List your surplus energy at a rate that beats the grid feed-in." />

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white/15 p-6 space-y-5 text-white">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white/80">Listing title</Label>
          <Input id="title" placeholder="e.g. Rooftop solar surplus — October" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-white/80">Energy type</Label>
            <Select value={form.energy_type} onValueChange={(v) => setForm({ ...form, energy_type: v })}>
              <SelectTrigger id="type" className="bg-white/20 border-white/30 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENERGY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white/80">Amount (kWh)</Label>
            <Input id="amount" type="number" min="0" step="0.01" placeholder="100" value={form.amount_kwh} onChange={(e) => setForm({ ...form, amount_kwh: e.target.value })} className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from" className="text-white/80">Available from</Label>
            <Select value={form.available_from} onValueChange={(v) => setForm({ ...form, available_from: v })}>
              <SelectTrigger id="from" className="bg-white/20 border-white/30 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="to" className="text-white/80">Available to</Label>
            <Select value={form.available_to} onValueChange={(v) => setForm({ ...form, available_to: v })}>
              <SelectTrigger id="to" className="bg-white/20 border-white/30 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate" className="text-white/80">Rate per kWh ({formatCurrency(GOV_BUY_RATE)} – {formatCurrency(GOV_SELL_RATE)})</Label>
          <Input id="rate" type="number" min={GOV_BUY_RATE} max={GOV_SELL_RATE} step="0.001" placeholder="0.18" value={form.rate_per_kwh} onChange={(e) => setForm({ ...form, rate_per_kwh: e.target.value })} className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
          {form.rate_per_kwh && !rateValid && (
            <p className="text-xs text-rose-200">Rate must be between {formatCurrency(GOV_BUY_RATE)} and {formatCurrency(GOV_SELL_RATE)}.</p>
          )}
        </div>

        <div className="rounded-xl bg-white/10 p-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-white/70">Total value</span><span className="font-semibold">{formatCurrency(total)}</span></div>
          <div className="flex justify-between"><span className="text-white/70">vs. grid feed-in</span><span className="text-emerald-50 font-medium">+{formatCurrency((rate - GOV_BUY_RATE) * kwh)}</span></div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full bg-white text-[#1c4d7d] hover:bg-white/90">
          {submitting ? "Creating…" : "Publish listing"}
        </Button>
      </form>
    </div>
  );
}