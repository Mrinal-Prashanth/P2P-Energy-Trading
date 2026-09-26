import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home as HomeIcon, Store, Receipt, Bell, BookOpen, TrendingUp } from "lucide-react";
import AiAssistant from "@/components/AiAssistant";
import GlowBackground from "@/components/GlowBackground";
import TranslateWidget from "@/components/TranslateWidget";
import OnboardingModal from "@/components/OnboardingModal";

const navItems = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/marketplace", label: "Listings", icon: Store },
  { to: "/insights", label: "Insights", icon: TrendingUp },
  { to: "/transactions", label: "Track", icon: Receipt },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/guide", label: "Guide", icon: BookOpen },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a69a0] to-[#1c4d7d] flex flex-col relative">
      <GlowBackground />
      <main className="relative z-10 flex-1 p-4 md:p-6 pb-28 overflow-y-auto">
        <Outlet />
      </main>

      <AiAssistant />
      <TranslateWidget />
      <OnboardingModal />

      <nav className="fixed bottom-0 inset-x-0 bg-white/10 backdrop-blur-md border-t border-white/20 flex items-center justify-around py-2 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className="flex flex-col items-center gap-0.5 px-2 py-1">
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/50"}`} />
                  <span className={`text-[10px] ${isActive ? "text-white font-medium" : "text-white/50"}`}>{item.label}</span>
                  <span className={`h-0.5 w-5 rounded-full ${isActive ? "bg-white" : "bg-transparent"}`} />
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}