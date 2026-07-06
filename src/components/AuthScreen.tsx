"use client";
import { useState } from "react";
import { Mail, Lock, User, Shield } from "./icons";

interface AuthScreenProps {
  onLogin: (token: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@fxhawk.com");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      // Seed demo data first on login attempt
      if (mode === "login" && email === "demo@fxhawk.com") {
        setSeeding(true);
        await fetch("/api/seed", { method: "POST" });
        setSeeding(false);
      }

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { email, name, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onLogin(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)" }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-bg flex items-center justify-center glow animate-pulse-glow">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">FX Hawk Journal</h1>
          <p className="text-dark-200 mt-2 text-sm">Premium Trading Journal</p>
        </div>

        {/* Form */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="text-xs text-dark-200 mb-1 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                <input
                  type="text"
                  placeholder="Alex Trader"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full !pl-10"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-dark-200 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full !pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-dark-200 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full !pl-10"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 glow"
          >
            {loading ? (seeding ? "Loading demo data..." : "Please wait...") : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <p className="text-center text-sm text-dark-200">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-accent-400 font-medium hover:underline"
            >
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>

          {mode === "login" && (
            <div className="text-center text-xs text-dark-300 pt-2 border-t border-dark-600">
              Demo: demo@fxhawk.com / demo1234
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
