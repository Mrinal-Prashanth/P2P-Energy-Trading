import { base44 } from "@/api/base44Client";

// Seller accepts a buyer's offer: deduct from the BUYER's wallet, credit the seller,
// mark the listing sold (or reduce remaining kWh), and abort all other pending offers.
export async function acceptOffer(order) {
  const total = order.amount;
  const qty = order.kwh;
  const listing = await base44.entities.Listing.get(order.listing_id);
  const allWallets = await base44.entities.Wallet.list("-created_date", 500);
  const buyerWallet = allWallets.find((w) => w.created_by_id === order.created_by_id);
  const sellerWallet = allWallets.find((w) => w.created_by_id === listing.created_by_id);

  if (!buyerWallet || (buyerWallet.balance || 0) < total) {
    return { ok: false, reason: "insufficient" };
  }

  await base44.entities.Wallet.update(buyerWallet.id, { balance: (buyerWallet.balance || 0) - total });
  if (sellerWallet) {
    await base44.entities.Wallet.update(sellerWallet.id, { balance: (sellerWallet.balance || 0) + total });
  }

  if (qty >= listing.amount_kwh) {
    await base44.entities.Listing.update(listing.id, { status: "sold", buyer_name: order.buyer_name || "Buyer" });
  } else {
    await base44.entities.Listing.update(listing.id, { amount_kwh: listing.amount_kwh - qty });
  }

  await base44.entities.Transaction.update(order.id, { approval_status: "approved" });

  // Abort all other pending offers on the same listing (only one offer wins).
  const otherOffers = await base44.entities.Transaction.filter(
    { listing_id: order.listing_id, type: "trade_purchase", approval_status: "waiting" },
    "-created_date",
    100
  );
  const toAbort = otherOffers
    .filter((t) => t.id !== order.id)
    .map((t) => ({ id: t.id, approval_status: "rejected", transfer_status: "aborted" }));
  if (toAbort.length) await base44.entities.Transaction.bulkUpdate(toAbort);

  return { ok: true, aborted: toAbort.length };
}

// Reject / cancel an offer — aborts the transfer.
export async function rejectOffer(order) {
  await base44.entities.Transaction.update(order.id, { approval_status: "rejected", transfer_status: "aborted" });
  return { ok: true };
}