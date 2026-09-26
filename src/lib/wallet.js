import { base44 } from "@/api/base44Client";

// Get the current user's wallet, creating it (funded with a welcome bonus) on first access.
// Uses list + find instead of filter(created_by_id) which can return empty inconsistently.
export async function getMyWallet() {
  const me = await base44.auth.me();
  const all = await base44.entities.Wallet.list("-created_date", 500);
  const mine = all.find((w) => w.created_by_id === me.id);
  if (mine) return mine;
  return await base44.entities.Wallet.create({ balance: 100 });
}