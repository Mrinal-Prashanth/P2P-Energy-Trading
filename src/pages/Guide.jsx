import React from "react";
import { Shield, BookOpen, Zap, ArrowRightLeft, Wallet, MapPin, Lock, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const STEPS = [
{ icon: Zap, title: "List excess energy", text: "A producer with surplus solar/wind/battery energy creates a listing with a quantity (kWh) and a rate per kWh, bounded between the BESCOM feed-in tariff and the retail rate so both sides win." },
{ icon: ArrowRightLeft, title: "Buyer makes an offer", text: "A neighbour requests to buy some quantity. If offers already exist, the next buyer must offer more — like a transparent bidding queue." },
{ icon: Users, title: "Seller approves", text: "The seller reviews incoming offers and accepts or rejects. If either party rejects, the whole transfer is aborted — no money or energy moves." },
{ icon: Wallet, title: "Instant wallet transfer", text: "On approval, the buyer's wallet is debited and the seller's wallet is credited instantly. No banks, no payment gateway fees — that's the UPI-style advantage." },
{ icon: MapPin, title: "Track & chat", text: "Both parties track the transfer through three stages (Yet to Transmit → Half → Full) and chat with each other in real time inside the order." }];


const MANUAL = [
{ icon: Zap, title: "Sell energy", text: "Go to Sell Energy, enter your quantity, availability window, and rate. Your listing appears in the marketplace." },
{ icon: ArrowRightLeft, title: "Buy energy", text: "Browse Listings, tap a listing, enter how much you need, and send an offer. You'll see your savings vs BESCOM." },
{ icon: Wallet, title: "Wallet", text: "Top up your wallet (max $500 per top-up) or withdraw funds. All trades use the in-app wallet." },
{ icon: MapPin, title: "Track", text: "See your requests, approve incoming offers, and open any order to track transfer and chat." },
{ icon: Users, title: "Insights & Notifications", text: "Use Smart Sell Insights to find the best time to sell, and check Notifications for neighbour comparisons and demand alerts." }];


const PEER_APPS = [
{ name: "Power Ledger", country: "Australia", note: "Blockchain-based P2P renewable energy trading." },
{ name: "VOLT / SonnenCommunity", country: "Germany", note: "Battery storage sharing among neighbours." },
{ name: "LO3 Energy", country: "USA", note: "Brooklyn microgrid — local energy markets." },
{ name: "Energy Web", country: "Global", note: "Open-source decentralised energy trading." },
{ name: "Piclo", country: "UK", note: "Peer-to-peer renewable matching platform." },
{ name: "Bankya / Trendy", country: "Spain", note: "Community solar energy sharing." }];


export default function Guide() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader icon={BookOpen} title="Guide & Policy" subtitle="How VoltShare works, the instruction manual, and your privacy." />

      {/* How P2P works */}
      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5" />
          <h2 className="font-semibold">How peer-to-peer energy transfer works</h2>
        </div>
        <div className="space-y-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  {i < STEPS.length - 1 && <div className="w-0.5 flex-1 bg-white/20 my-1" />}
                </div>
                <div className="pb-2">
                  <div className="font-medium text-sm">{s.title}</div>
                  <div className="text-sm text-white/75 mt-0.5">{s.text}</div>
                </div>
              </div>);

          })}
        </div>
      </div>

      {/* Instruction manual */}
      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <div className="flex items-center gap-2 mb-3"><BookOpen className="w-5 h-5" /><h2 className="font-semibold">Instruction manual</h2></div>
        <div className="grid sm:grid-cols-2 gap-3">
          {MANUAL.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="rounded-xl bg-white/10 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-white/80" />
                  <span className="font-medium text-sm">{m.title}</span>
                </div>
                <p className="text-xs text-white/70">{m.text}</p>
              </div>);

          })}
        </div>
      </div>

      {/* Other P2P apps */}
      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><h2 className="font-semibold">Other peer-to-peer energy platforms</h2></div>
        
        <div className="grid sm:grid-cols-2 gap-2">
          {PEER_APPS.map((a) =>
          <div key={a.name} className="rounded-xl bg-white/10 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{a.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">{a.country}</span>
              </div>
              <p className="text-xs text-white/70 mt-1">{a.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Privacy & security policy */}
      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5" /><h2 className="font-semibold">Security & privacy policy</h2></div>
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex gap-2"><Lock className="w-4 h-4 mt-0.5 shrink-0" /><p><span className="font-medium text-white">Data we store:</span> your name, email, wallet balance, listings, transactions, and chat messages — only what's needed to run the marketplace.</p></div>
          <div className="flex gap-2"><Lock className="w-4 h-4 mt-0.5 shrink-0" /><p><span className="font-medium text-white">Authentication:</span> passwords are hashed by the platform auth provider; we never see or store raw passwords. Email verification (OTP) is required at sign-up.</p></div>
          <div className="flex gap-2"><Lock className="w-4 h-4 mt-0.5 shrink-0" /><p><span className="font-medium text-white">Wallet & trades:</span> all balances are tracked inside the app. No external bank or card details are collected in this demo. Top-ups are capped at $500.</p></div>
          <div className="flex gap-2"><Lock className="w-4 h-4 mt-0.5 shrink-0" /><p><span className="font-medium text-white">Chat:</span> buyer-seller messages are private to the two parties in an order. Inappropriate language is automatically filtered.</p></div>
          <div className="flex gap-2"><Lock className="w-4 h-4 mt-0.5 shrink-0" /><p><span className="font-medium text-white">Your control:</span> you can cancel your listings and offers at any time. Rejecting an offer aborts the transfer completely.</p></div>
        </div>
        <p className="text-xs text-white/50 mt-4">This is a demonstration app. Data is handled per the Base44 platform privacy standards.</p>
      </div>
    </div>);

}