import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, User } from "lucide-react";
import { getMyWallet } from "@/lib/wallet";
import { formatCurrency } from "@/lib/energyConfig";

export default function PageHeader({ icon: Icon = Leaf, title, subtitle, refreshKey = 0 }) {
  const [wallet, setWallet] = useState(null);
  useEffect(() => {
    getMyWallet().then(setWallet).catch(() => {});
  }, [refreshKey]);

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <Icon className="w-7 h-7 text-white shrink-0 mt-1" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold leading-tight text-white">{title}</h1>
          {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/wallet"
          className="rounded-xl bg-white/20 px-3 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-white/25 transition-colors"
        >
          Current Balance: {formatCurrency(wallet?.balance || 0)}
        </Link>
        <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}