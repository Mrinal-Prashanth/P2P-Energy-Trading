import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your VoltShare assistant. Ask me about buying energy, selling listings, or your wallet." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await base44.functions.invoke("aiChat", { message: text, history });
      setMessages((m) => [...m, { role: "assistant", content: res.data?.reply || "Sorry, I couldn't get a response." }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[min(92vw,22rem)] rounded-2xl bg-[#143d6b]/95 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "60vh" }}
        >
          <div className="flex items-center justify-between p-3 border-b border-white/15">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">AI Assistant</div>
                <div className="text-[10px] text-white/60">ChatGPT</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-auto bg-white text-[#1c4d7d]" : "bg-white/15 text-white"
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && <div className="text-white/60 text-xs">Assistant is typing…</div>}
          </div>

          <div className="p-3 border-t border-white/15 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message..."
              className="flex-1 rounded-full bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none"
            />
            <button
              onClick={send}
              disabled={sending}
              className="w-9 h-9 rounded-full bg-white text-[#1c4d7d] flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] pl-3 pr-4 py-3 shadow-lg hover:scale-[1.02] transition-transform"
        >
          <Bot className="w-5 h-5 text-white" />
          <div className="text-left leading-tight">
            <div className="text-xs font-semibold text-white">AI Assistant</div>
            <div className="text-[10px] text-white/80">ChatGPT</div>
          </div>
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      )}
    </>
  );
}