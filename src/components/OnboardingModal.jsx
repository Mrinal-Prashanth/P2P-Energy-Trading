import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, X, ArrowRight, Shield } from "lucide-react";

const ONBOARDED_KEY = "voltshare_onboarded_v1";

export function hasOnboarded() {
  try { return localStorage.getItem(ONBOARDED_KEY) === "1"; } catch (e) { return false; }
}

export default function OnboardingModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(ONBOARDED_KEY) !== "1"; } catch (e) { return true; }
  });

  const dismiss = () => {
    try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch (e) {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#2a69a0] to-[#1c4d7d] border border-white/20 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg">Welcome to VoltShare</h2>
          </div>
          <button onClick={dismiss} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-sm text-white/80 mb-4">
          VoltShare is the UPI equivalent for peer-to-peer energy trading — sell your surplus solar, wind, or battery
          energy directly to neighbours and earn more than the grid feed-in rate.
        </p>

        <div className="space-y-2 mb-5">
          {[
            "List your excess energy at a rate between the grid feed-in and retail price.",
            "Buyers send you an offer; you approve or reject it.",
            "On approval, energy is transferred and your wallet is credited instantly.",
            "Track every transfer and chat with the other party in real time.",
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-white/85">{s}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={dismiss} className="flex-1 rounded-xl bg-white/15 py-2.5 text-sm font-medium hover:bg-white/25">
            Get started
          </button>
          <button onClick={() => { dismiss(); navigate("/guide"); }} className="flex-1 rounded-xl bg-white text-[#1c4d7d] py-2.5 text-sm font-semibold flex items-center justify-center gap-1">
            <Shield className="w-4 h-4" /> Read guide <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}