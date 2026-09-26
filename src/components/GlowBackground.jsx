import React from "react";

// Decorative glowing gradient circles for the app background (#8).
export default function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-400/30 blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-blue-400/25 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-teal-300/20 blur-3xl animate-pulse" style={{ animationDuration: "7s" }} />
      <div className="absolute top-10 left-1/2 w-40 h-40 rounded-full bg-emerald-300/15 blur-2xl animate-pulse" style={{ animationDuration: "9s" }} />
    </div>
  );
}