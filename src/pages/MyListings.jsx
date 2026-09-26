import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListOrdered, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

export default function MyListings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [me, setMe] = useState(null);

  const load = async (userId) => {
    const all = await base44.entities.Listing.list("-created_date", 500);
    setListings(all.filter((l) => l.created_by_id === userId));
  };

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setMe(user);
        await load(user.id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCancel = async (listing) => {
    try {
      await base44.entities.Listing.update(listing.id, { status: "cancelled" });
      toast({ title: "Listing cancelled" });
      await load(me.id);
    } catch (e) {
      toast({ title: "Could not cancel", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const open = listings.filter((l) => l.status === "open");
  const sold = listings.filter((l) => l.status === "sold");
  const cancelled = listings.filter((l) => l.status === "cancelled");

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader icon={ListOrdered} title="My Listings" subtitle="Manage the energy you've put up for sale." />

      <Link
        to="/sell"
        className="flex items-center justify-center gap-2 rounded-2xl bg-white text-[#1c4d7d] py-3 font-semibold hover:bg-white/90 transition-colors"
      >
        <Plus className="w-5 h-5" /> Add a New Listing
      </Link>

      <section>
        <h2 className="font-semibold mb-3 text-white">Open ({open.length})</h2>
        {open.length === 0 ? (
          <div className="text-center py-10 text-white/60 rounded-2xl bg-white/10">No open listings.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {open.map((l) => (
              <div key={l.id} className="space-y-2">
                <ListingCard listing={l} owned showSeller={false} />
                <Button variant="outline" className="w-full border-white/40 text-white bg-transparent hover:bg-white/10" onClick={() => handleCancel(l)}>
                  Cancel listing
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {sold.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 text-white">Sold ({sold.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sold.map((l) => <ListingCard key={l.id} listing={l} owned showSeller={false} />)}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 text-white">Cancelled ({cancelled.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {cancelled.map((l) => <ListingCard key={l.id} listing={l} owned showSeller={false} />)}
          </div>
        </section>
      )}
    </div>
  );
}