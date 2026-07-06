"use client";
import { Home, BarChart3, Calendar, Settings, Plus, AlertTriangle, Clock } from "./icons";

type Screen = "dashboard" | "add" | "analytics" | "calendar" | "search" | "settings" | "detail" | "edit" | "accounts" | "mt5import" | "missed" | "offsession";

interface BottomNavProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

const navItems: { icon: typeof Home; label: string; screen: Screen }[] = [
  { icon: Home, label: "Home", screen: "dashboard" },
  { icon: BarChart3, label: "Analytics", screen: "analytics" },
  { icon: AlertTriangle, label: "Missed", screen: "missed" },
  { icon: Clock, label: "Off-Sess", screen: "offsession" },
  { icon: Settings, label: "Settings", screen: "settings" },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <>
      <button onClick={() => onNavigate("add")} className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full gradient-bg flex items-center justify-center shadow-2xl glow animate-pulse-glow"><Plus className="w-7 h-7 text-white" /></button>
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-dark-600/50 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const isActive = active === item.screen;
            const Icon = item.icon;
            return (<button key={item.screen} onClick={() => onNavigate(item.screen)} className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all ${isActive ? "text-accent-400 bg-accent-500/10" : "text-dark-300"}`}><Icon className="w-5 h-5" /><span className="text-[9px] font-medium">{item.label}</span></button>);
          })}
        </div>
      </nav>
    </>
  );
}
