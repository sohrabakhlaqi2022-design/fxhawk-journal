"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Check, Layers, Mic, Square, Trash2, Plus, X } from "./icons";
import type { Trade, Account } from "@/lib/types";

interface AddTradeProps {
  onBack: () => void;
  onSave: (data: Partial<Trade>) => Promise<void>;
  editTrade?: Trade | null;
  accounts: Account[];
  defaultAccountId?: number | null;
}

const PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "NZD/USD", "USD/CAD", "EUR/GBP", "EUR/JPY", "GBP/JPY", "AUD/JPY", "XAU/USD", "XAG/USD", "NAS100", "US30", "SPX500", "BTC/USD", "ETH/USD"];
const SESSIONS = ["London", "New York", "Tokyo", "Sydney", "Overlap"];
const RESULTS = ["Win", "Loss", "Breakeven"];
const EMOTIONS = ["Calm", "Confident", "Focused", "Neutral", "Anxious", "Fearful", "Greedy", "Excited", "Frustrated", "Hopeful", "Uncertain", "Satisfied", "Happy", "Disappointed", "Relieved", "Thrilled", "Proud", "Ecstatic"];
const DEFAULT_STRATEGIES = ["Breakout", "Supply & Demand", "Order Block", "Fibonacci Retracement", "Trend Continuation", "Support Bounce", "Resistance Rejection", "Price Action", "Smart Money", "Scalping", "Swing Trading"];
const MARKETS = ["Forex", "Indices", "Commodities", "Crypto", "Stocks"];
const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];

export default function AddTrade({ onBack, onSave, editTrade, accounts, defaultAccountId }: AddTradeProps) {
  const [customStrategies, setCustomStrategies] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem("fxhawk_strategies");
    if (saved) {
      try { setCustomStrategies(JSON.parse(saved)); } catch {}
    }
  }, []);

  const allStrategies = [...DEFAULT_STRATEGIES, ...customStrategies];

  const getInitialAccountId = () => {
    if (editTrade?.accountId) return editTrade.accountId.toString();
    if (defaultAccountId) return defaultAccountId.toString();
    if (accounts.length > 0) return accounts[0].id.toString();
    return "";
  };

  const [form, setForm] = useState({
    accountId: getInitialAccountId(),
    pair: editTrade?.pair || "",
    date: editTrade?.date ? new Date(editTrade.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    session: editTrade?.session || "",
    position: editTrade?.position || "Buy",
    entry: editTrade?.entry || "",
    stopLoss: editTrade?.stopLoss || "",
    takeProfit: editTrade?.takeProfit || "",
    riskPercent: editTrade?.riskPercent || "",
    reward: editTrade?.reward || "",
    rr: editTrade?.rr || "",
    lotSize: editTrade?.lotSize || "",
    result: editTrade?.result || "Win",
    profit: editTrade?.profit || "",
    loss: editTrade?.loss || "",
    commission: editTrade?.commission || "",
    notes: editTrade?.notes || "",
    psychologyNotes: editTrade?.psychologyNotes || "",
    mistakes: editTrade?.mistakes || "",
    lessonsLearned: editTrade?.lessonsLearned || "",
    emotionBefore: editTrade?.emotionBefore || "",
    emotionAfter: editTrade?.emotionAfter || "",
    tags: editTrade?.tags ? (editTrade.tags as string[]).join(", ") : "",
    strategyName: editTrade?.strategyName || "",
    market: editTrade?.market || "",
    timeframe: editTrade?.timeframe || "",
    broker: editTrade?.broker || "",
    screenshotBefore: editTrade?.screenshotBefore || "",
    screenshotAfter: editTrade?.screenshotAfter || "",
    voiceNote: editTrade?.voiceNote || "",
  });
  
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [newStrategy, setNewStrategy] = useState("");
  const [showAddStrategy, setShowAddStrategy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(editTrade?.voiceNote || "");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addStrategy = () => {
    if (!newStrategy.trim()) return;
    const updated = [...customStrategies, newStrategy.trim()];
    setCustomStrategies(updated);
    localStorage.setItem("fxhawk_strategies", JSON.stringify(updated));
    updateField("strategyName", newStrategy.trim());
    setNewStrategy("");
    setShowAddStrategy(false);
  };

  const handleImageUpload = (field: "screenshotBefore" | "screenshotAfter") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1200;
        let { width, height } = img;
        if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        else if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        updateField(field, canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => { const base64 = reader.result as string; setAudioUrl(base64); updateField("voiceNote", base64); };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { alert("Could not access microphone"); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };
  const deleteVoice = () => { setAudioUrl(""); updateField("voiceNote", ""); };

  const handleSave = async () => {
    if (!form.pair || !form.position || !form.result) { alert("Please fill: Pair, Position, Result"); return; }
    setSaving(true);
    try {
      await onSave({ ...form, accountId: form.accountId ? parseInt(form.accountId) : null, tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [] } as unknown as Partial<Trade>);
      onBack();
    } catch (err) { console.error("Save error:", err); alert("Failed to save trade"); }
    finally { setSaving(false); }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBack} className="w-9 h-9 rounded-xl glass flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white" /></button>
        <h1 className="text-lg font-bold text-white flex-1">{editTrade ? "Edit Trade" : "Add Trade"}</h1>
        <button type="button" onClick={handleSave} disabled={saving || !form.pair || !form.result} className="px-4 py-2 rounded-xl gradient-bg text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-1">
          <Check className="w-4 h-4" />{saving ? "..." : "Save"}
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[1, 2, 3].map((s) => (
          <button key={s} type="button" onClick={() => setStep(s)} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${step === s ? "gradient-bg text-white" : "glass text-dark-200"}`}>
            {s === 1 ? "📊 Details" : s === 2 ? "📸 Media" : "🧠 Notes"}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-4">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm mb-2">📊 Trade Details</h3>
            {accounts.length > 0 && (
              <div>
                <label className="text-xs text-dark-200 mb-1 block">Account</label>
                <select value={form.accountId} onChange={(e) => updateField("accountId", e.target.value)} className="w-full">
                  <option value="">Select account</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (${parseFloat(a.initialBalance).toLocaleString()})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-dark-200 mb-1 block">Currency Pair *</label>
              <select value={form.pair} onChange={(e) => updateField("pair", e.target.value)} className="w-full">
                <option value="">Select pair</option>
                {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-dark-200 mb-1 block">Date & Time *</label><input type="datetime-local" value={form.date} onChange={(e) => updateField("date", e.target.value)} className="w-full" /></div>
              <div><label className="text-xs text-dark-200 mb-1 block">Session</label><select value={form.session} onChange={(e) => updateField("session", e.target.value)} className="w-full"><option value="">Select</option>{SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <div>
              <label className="text-xs text-dark-200 mb-1 block">Position *</label>
              <div className="flex gap-2">
                {["Buy", "Sell"].map((p) => (<button key={p} type="button" onClick={() => updateField("position", p)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.position === p ? p === "Buy" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-dark-700/50 text-dark-200 border border-dark-600/30"}`}>{p}</button>))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-dark-200 mb-1 block">Entry</label><input type="number" step="any" placeholder="0.00" value={form.entry} onChange={(e) => updateField("entry", e.target.value)} className="w-full" /></div>
              <div><label className="text-xs text-dark-200 mb-1 block">Stop Loss</label><input type="number" step="any" placeholder="0.00" value={form.stopLoss} onChange={(e) => updateField("stopLoss", e.target.value)} className="w-full" /></div>
              <div><label className="text-xs text-dark-200 mb-1 block">Take Profit</label><input type="number" step="any" placeholder="0.00" value={form.takeProfit} onChange={(e) => updateField("takeProfit", e.target.value)} className="w-full" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-dark-200 mb-1 block">Risk %</label><input type="number" step="any" placeholder="1.0" value={form.riskPercent} onChange={(e) => updateField("riskPercent", e.target.value)} className="w-full" /></div>
              <div><label className="text-xs text-dark-200 mb-1 block">RR</label><input type="number" step="any" placeholder="2.0" value={form.rr} onChange={(e) => updateField("rr", e.target.value)} className="w-full" /></div>
              <div><label className="text-xs text-dark-200 mb-1 block">Lot Size</label><input type="number" step="any" placeholder="0.01" value={form.lotSize} onChange={(e) => updateField("lotSize", e.target.value)} className="w-full" /></div>
            </div>
            <div>
              <label className="text-xs text-dark-200 mb-1 block">Result *</label>
              <div className="flex gap-2">
                {RESULTS.map((r) => (<button key={r} type="button" onClick={() => updateField("result", r)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.result === r ? r === "Win" ? "bg-green-500/20 text-green-400 border border-green-500/30" : r === "Loss" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30" : "bg-dark-700/50 text-dark-200 border border-dark-600/30"}`}>{r}</button>))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-dark-200 mb-1 block">Profit ($)</label><input type="number" step="any" placeholder="0.00" value={form.profit} onChange={(e) => updateField("profit", e.target.value)} className="w-full" /></div>
              <div><label className="text-xs text-dark-200 mb-1 block">Loss ($)</label><input type="number" step="any" placeholder="0.00" value={form.loss} onChange={(e) => updateField("loss", e.target.value)} className="w-full" /></div>
              <div><label className="text-xs text-dark-200 mb-1 block">Commission</label><input type="number" step="any" placeholder="0.00" value={form.commission} onChange={(e) => updateField("commission", e.target.value)} className="w-full" /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm mb-2">📸 Screenshots</h3>
            <div>
              <label className="text-xs text-dark-200 mb-2 block">Before Trade</label>
              {form.screenshotBefore ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={form.screenshotBefore} alt="Before" className="w-full aspect-video object-cover" />
                  <button type="button" onClick={() => updateField("screenshotBefore", "")} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500/80 flex items-center justify-center"><Trash2 className="w-4 h-4 text-white" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-dark-500 bg-dark-700/30 cursor-pointer hover:border-accent-500/50 transition-all">
                  <Layers className="w-8 h-8 text-dark-400 mb-2" /><span className="text-dark-300 text-sm">Tap to select from gallery</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload("screenshotBefore")} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <label className="text-xs text-dark-200 mb-2 block">After Trade (Result)</label>
              {form.screenshotAfter ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={form.screenshotAfter} alt="After" className="w-full aspect-video object-cover" />
                  <button type="button" onClick={() => updateField("screenshotAfter", "")} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500/80 flex items-center justify-center"><Trash2 className="w-4 h-4 text-white" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-dark-500 bg-dark-700/30 cursor-pointer hover:border-accent-500/50 transition-all">
                  <Layers className="w-8 h-8 text-dark-400 mb-2" /><span className="text-dark-300 text-sm">Tap to select from gallery</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload("screenshotAfter")} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <label className="text-xs text-dark-200 mb-2 block">🎙️ Voice Note</label>
              <div className="glass rounded-xl p-4">
                {audioUrl ? (
                  <div className="flex items-center gap-3"><audio src={audioUrl} controls className="flex-1 h-10" /><button type="button" onClick={deleteVoice} className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-400" /></button></div>
                ) : isRecording ? (
                  <div className="flex items-center justify-center gap-4"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /><span className="text-red-400 text-sm">Recording...</span><button type="button" onClick={stopRecording} className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center"><Square className="w-5 h-5 text-red-400" /></button></div>
                ) : (
                  <button type="button" onClick={startRecording} className="w-full py-3 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center gap-2 text-accent-400"><Mic className="w-5 h-5" /><span className="text-sm font-medium">Record Voice Note</span></button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm mb-2">🧠 Psychology & Notes</h3>
            <div>
              <div className="flex items-center justify-between mb-1"><label className="text-xs text-dark-200">Strategy</label><button type="button" onClick={() => setShowAddStrategy(!showAddStrategy)} className="text-xs text-accent-400 flex items-center gap-1"><Plus className="w-3 h-3" /> Add New</button></div>
              {showAddStrategy && (<div className="flex gap-2 mb-2"><input type="text" placeholder="New strategy name" value={newStrategy} onChange={(e) => setNewStrategy(e.target.value)} className="flex-1" /><button type="button" onClick={addStrategy} className="px-3 py-2 rounded-xl gradient-bg text-white text-sm">Add</button><button type="button" onClick={() => { setShowAddStrategy(false); setNewStrategy(""); }} className="px-3 py-2 rounded-xl glass text-dark-200 text-sm"><X className="w-4 h-4" /></button></div>)}
              <select value={form.strategyName} onChange={(e) => updateField("strategyName", e.target.value)} className="w-full"><option value="">Select strategy</option>{allStrategies.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              <input type="text" placeholder="Or type custom strategy..." value={form.strategyName} onChange={(e) => updateField("strategyName", e.target.value)} className="w-full mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-dark-200 mb-1 block">Market</label><select value={form.market} onChange={(e) => updateField("market", e.target.value)} className="w-full"><option value="">Select</option>{MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><label className="text-xs text-dark-200 mb-1 block">Timeframe</label><select value={form.timeframe} onChange={(e) => updateField("timeframe", e.target.value)} className="w-full"><option value="">Select</option>{TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-dark-200 mb-1 block">Emotion Before</label><select value={form.emotionBefore} onChange={(e) => updateField("emotionBefore", e.target.value)} className="w-full"><option value="">Select</option>{EMOTIONS.map((em) => <option key={em} value={em}>{em}</option>)}</select></div>
              <div><label className="text-xs text-dark-200 mb-1 block">Emotion After</label><select value={form.emotionAfter} onChange={(e) => updateField("emotionAfter", e.target.value)} className="w-full"><option value="">Select</option>{EMOTIONS.map((em) => <option key={em} value={em}>{em}</option>)}</select></div>
            </div>
            <div><label className="text-xs text-dark-200 mb-1 block">Trade Notes</label><textarea rows={3} placeholder="Describe the setup..." value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className="w-full !rounded-xl" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Psychology Notes</label><textarea rows={2} placeholder="Mental state..." value={form.psychologyNotes} onChange={(e) => updateField("psychologyNotes", e.target.value)} className="w-full !rounded-xl" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Mistakes</label><textarea rows={2} placeholder="Any mistakes..." value={form.mistakes} onChange={(e) => updateField("mistakes", e.target.value)} className="w-full !rounded-xl" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Lessons Learned</label><textarea rows={2} placeholder="Key takeaways..." value={form.lessonsLearned} onChange={(e) => updateField("lessonsLearned", e.target.value)} className="w-full !rounded-xl" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Tags (comma separated)</label><input type="text" placeholder="e.g., breakout, trend" value={form.tags} onChange={(e) => updateField("tags", e.target.value)} className="w-full" /></div>
          </div>
        )}
      </div>
    </div>
  );
}
