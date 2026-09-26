import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Languages, X, Loader2, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const LANGUAGES = [
  "Hindi", "Kannada", "Tamil", "Telugu", "Malayalam", "Bengali", "Marathi",
  "Gujarati", "Punjabi", "Urdu", "Arabic", "Spanish", "French", "German", "Chinese",
  "Japanese", "Portuguese", "Russian", "Indonesian",
];

export default function TranslateWidget() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("Hindi");
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(false);
  const originals = useRef([]);
  const location = useLocation();

  const revertPage = () => {
    originals.current.forEach(({ node, value }) => { if (node) node.nodeValue = value; });
    originals.current = [];
    setTranslated(false);
  };

  // When the user navigates, the previous page's nodes are gone — reset state.
  useEffect(() => {
    originals.current = [];
    setTranslated(false);
  }, [location.pathname]);

  const translatePage = async () => {
    const main = document.querySelector("main");
    if (!main) return;
    // Restore any previous translation before re-translating.
    originals.current.forEach(({ node, value }) => { if (node) node.nodeValue = value; });
    originals.current = [];

    setTranslating(true);
    try {
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null);
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) {
        if (n.nodeValue && n.nodeValue.trim()) nodes.push(n);
      }
      const parsed = nodes.map((node) => {
        const m = node.nodeValue.match(/^(\s*)([\s\S]*?)(\s*)$/);
        return { node, lead: m[1], core: m[2], trail: m[3], original: node.nodeValue };
      });
      const uniqueCores = [...new Set(parsed.map((p) => p.core))];
      const res = await base44.functions.invoke("translateText", { texts: uniqueCores, targetLang: lang });
      const translations = res.data?.translations || [];
      const map = {};
      uniqueCores.forEach((c, i) => { map[c] = translations[i] || c; });
      originals.current = parsed.map((p) => ({ node: p.node, value: p.original }));
      parsed.forEach((p) => { p.node.nodeValue = p.lead + (map[p.core] || p.core) + p.trail; });
      setTranslated(true);
      toast({ title: `Page translated to ${lang}` });
    } catch (e) {
      toast({ title: "Translation failed", description: e.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed left-4 bottom-20 z-50 w-12 h-12 rounded-full bg-white text-[#1c4d7d] shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        title="Translate page"
      >
        <Languages className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed left-4 bottom-36 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-[#143d6b]/95 backdrop-blur-md border border-white/20 p-4 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Languages className="w-4 h-4" /> Translate page
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <label className="text-xs text-white/70">Choose a language</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="mt-1 w-full rounded-xl bg-white/20 border border-white/30 px-3 py-2 text-sm text-white outline-none"
          >
            {LANGUAGES.map((l) => <option key={l} value={l} className="text-black">{l}</option>)}
          </select>

          <div className="flex gap-2 mt-3">
            <button
              onClick={translatePage}
              disabled={translating}
              className="flex-1 px-3 py-2 rounded-xl bg-white text-[#1c4d7d] text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : translated ? "Re-translate" : "Translate page"}
            </button>
            {translated && (
              <button onClick={revertPage} className="px-3 py-2 rounded-xl bg-white/20 text-white text-sm flex items-center gap-1">
                <RotateCcw className="w-4 h-4" /> Revert
              </button>
            )}
          </div>
          <p className="text-[11px] text-white/50 mt-2">Translates all visible text on this page. Press Revert to restore English.</p>
        </div>
      )}
    </>
  );
}