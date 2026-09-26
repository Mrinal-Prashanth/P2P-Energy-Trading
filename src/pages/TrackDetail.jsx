import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Send, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatKwh } from "@/lib/energyConfig";
import { censorText } from "@/lib/censor";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

const STAGES = [
  { key: "yet_to_transmit", label: "Yet to Transmit", desc: "Request yet to be sent" },
  { key: "half_transmitted", label: "Half Transmitted", desc: "Request has been sent" },
  { key: "full_transmitted", label: "Full Transmitted", desc: "Energy has been injected" },
];

const PARTY_QUICK = ["Is there a delay?", "Yes", "No", "Thank you", "No problem"];

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-1.5">
      <span className="text-white/60">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function TrackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [listing, setListing] = useState(null);
  const [me, setMe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState("party");
  const [myRole, setMyRole] = useState("buyer");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const o = await base44.entities.Transaction.get(id);
    setOrder(o);
    let l = null;
    if (o.listing_id) {
      try { l = await base44.entities.Listing.get(o.listing_id); } catch (e) {}
    }
    setListing(l);
    const user = await base44.auth.me();
    setMe(user);
    const msgs = await base44.entities.Message.filter({ order_id: id }, "-created_date", 200);
    setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Determine the viewer's actual role (buyer or seller) — no manual switching.
  useEffect(() => {
    if (order && me) {
      const isSeller = listing && listing.created_by_id === me.id;
      setMyRole(isSeller ? "seller" : "buyer");
    }
  }, [order, me, listing]);

  const stageIndex = order ? STAGES.findIndex((s) => s.key === order.transfer_status) : 0;

  const send = async (text) => {
    const content = censorText((text ?? input).trim());
    if (!content) return;
    setInput("");
    const role = channel === "party" ? (myRole === "buyer" ? "user" : "assistant") : "user";
    await base44.entities.Message.create({ order_id: id, channel, role, content });
    await load();
    if (channel === "support") {
      setBusy(true);
      try {
        const history = messages.filter((m) => m.channel === "support").map((m) => ({ role: m.role, content: m.content }));
        const res = await base44.functions.invoke("aiChat", { message: content, history });
        await base44.entities.Message.create({ order_id: id, channel: "support", role: "assistant", content: res.data?.reply || "..." });
        await load();
      } catch (e) {
        toast({ title: "AI error", variant: "destructive" });
      } finally {
        setBusy(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const channelMessages = messages.filter((m) => m.channel === channel);
  const pricePerKwh = order?.kwh ? order.amount / order.kwh : 0;
  const selfRole = channel === "party" ? (myRole === "buyer" ? "user" : "assistant") : "user";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader icon={Zap} title="Track Transfer" subtitle="Monitor your energy request in real time." />

      <button onClick={() => navigate("/transactions")} className="flex items-center gap-1 text-sm text-white/80 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Track
      </button>

      {/* Status card with stepper (display only) */}
      <div className="rounded-2xl bg-white/15 p-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold">Tracking Your Energy Transfer</div>
          <button
            onClick={() => { navigator.clipboard?.writeText(id); toast({ title: "ID copied" }); }}
            className="text-xs text-white/70 flex items-center gap-1"
          >
            {id.slice(0, 8)} <Copy className="w-3 h-3" />
          </button>
        </div>
        <div className="text-xs text-white/60 mb-4">Transaction ID</div>

        <div className="flex items-start justify-between mb-2">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < stageIndex
                    ? "bg-emerald-400 text-emerald-950"
                    : i === stageIndex
                    ? "bg-amber-400 text-amber-950"
                    : "bg-white/20 text-white/60"
                }`}
              >
                {i + 1}
              </div>
              <div className="text-[10px] text-center mt-1 text-white/70 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-white/60 text-center">{STAGES[stageIndex]?.desc}</div>
        {order?.approval_status === "waiting" && (
          <div className="text-xs text-amber-50 bg-amber-400/20 rounded-md py-1.5 text-center mt-3">
            Awaiting seller approval before transfer begins.
          </div>
        )}
        {order?.approval_status === "rejected" && (
          <div className="text-xs text-rose-50 bg-rose-400/20 rounded-md py-1.5 text-center mt-3">
            This request was rejected by the seller.
          </div>
        )}
      </div>

      {/* Transfer details */}
      <div className="rounded-2xl bg-white/15 p-5 text-white space-y-2 text-sm">
        <Row label="Energy" value={order?.description} />
        <Row label="Quantity" value={formatKwh(order?.kwh || 0)} />
        <Row label="Price per kWh" value={formatCurrency(pricePerKwh)} />
        <Row label="Total Cost" value={formatCurrency(order?.amount || 0)} />
        <Row label="Seller" value={order?.counterparty_name} />
        <Row label="Available" value={listing ? `${listing.available_from || "—"}–${listing.available_to || ""}` : "—"} />
        <Row label="Approval" value={order?.approval_status} />
        <Row label="Last Updated" value={new Date(order?.updated_date || order?.created_date).toLocaleString()} />
      </div>

      {/* Chat */}
      <div className="rounded-2xl bg-white/15 p-4 text-white flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <button onClick={() => setChannel("party")} className={`px-3 py-1 rounded-full text-xs ${channel === "party" ? "bg-white text-[#1c4d7d]" : "bg-white/15 text-white"}`}>
              Buyer ↔ Seller
            </button>
            <button onClick={() => setChannel("support")} className={`px-3 py-1 rounded-full text-xs ${channel === "support" ? "bg-white text-[#1c4d7d]" : "bg-white/15 text-white"}`}>
              Support (AI)
            </button>
          </div>
          {channel === "party" && (
            <span className="text-[10px] text-white/50">You are the {myRole}</span>
          )}
        </div>

        <div className="overflow-y-auto space-y-2 mb-3 max-h-60 min-h-[6rem]">
          {channelMessages.length === 0 && <div className="text-xs text-white/50">No messages yet.</div>}
          {channelMessages.map((m, i) => {
            const isSelf = m.role === selfRole;
            const label = m.role === "user" ? "Buyer" : "Seller";
            return (
              <div key={i} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                {!isSelf && <span className="text-[10px] text-white/50 mb-0.5 ml-1">{label}</span>}
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isSelf ? "bg-white text-[#1c4d7d]" : "bg-white/15 text-white"}`}>
                  {m.content}
                </div>
              </div>
            );
          })}
          {busy && channel === "support" && <div className="text-white/60 text-xs">Assistant is typing…</div>}
        </div>

        {channel === "party" && (
          <div className="flex flex-wrap gap-2 mb-2">
            {PARTY_QUICK.map((q) => (
              <button key={q} onClick={() => send(q)} className="text-xs rounded-full bg-white/15 px-3 py-1 hover:bg-white/25">
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message as ${myRole}...`}
            className="flex-1 rounded-full bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none"
          />
          <button onClick={() => send()} disabled={busy} className="w-9 h-9 rounded-full bg-white text-[#1c4d7d] flex items-center justify-center disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}