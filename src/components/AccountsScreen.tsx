"use client";
import { useState } from "react";
import { ChevronLeft, Plus, Edit, Trash2, Check, X, DollarSign, Upload } from "./icons";
import type { Account } from "@/lib/types";

interface AccountsScreenProps {
  accounts: Account[];
  onBack: () => void;
  onSave: (data: Partial<Account>) => Promise<Account | void>;
  onUpdate: (id: number, data: Partial<Account>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onImport: (accountId: number) => void;
}

export default function AccountsScreen({ accounts, onBack, onSave, onUpdate, onDelete, onImport }: AccountsScreenProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    broker: "",
    initialBalance: "10000",
    currency: "USD",
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ name: "", broker: "", initialBalance: "10000", currency: "USD" });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (account: Account) => {
    setForm({
      name: account.name,
      broker: account.broker || "",
      initialBalance: account.initialBalance,
      currency: account.currency,
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingId, form);
      } else {
        await onSave(form);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this account? Trades will not be deleted.")) {
      await onDelete(id);
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl glass flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white flex-1">💼 Trading Accounts</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-2 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up">
          <h3 className="text-white font-semibold text-sm mb-4">
            {editingId ? "Edit Account" : "New Account"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-dark-200 mb-1 block">Account Name *</label>
              <input
                type="text"
                placeholder="e.g., Main Account, Demo Account"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-dark-200 mb-1 block">Broker</label>
              <input
                type="text"
                placeholder="e.g., IC Markets, Exness"
                value={form.broker}
                onChange={(e) => setForm({ ...form, broker: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-dark-200 mb-1 block">Initial Balance *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="10000"
                  value={form.initialBalance}
                  onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-dark-200 mb-1 block">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={resetForm}
                className="flex-1 py-2.5 rounded-xl glass text-dark-200 text-sm font-medium flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.name}
                className="flex-1 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account List */}
      {accounts.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <DollarSign className="w-12 h-12 text-dark-400 mx-auto mb-3" />
          <p className="text-dark-200 font-medium">No accounts yet</p>
          <p className="text-dark-300 text-sm mt-1">Add your first trading account</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-bold">{account.name}</h3>
                  {account.broker && (
                    <p className="text-dark-300 text-sm">{account.broker}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(account)}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 text-accent-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-dark-400 text-[10px] uppercase">Initial Balance</p>
                  <p className="text-accent-400 font-bold text-lg">
                    {account.currency} {parseFloat(account.initialBalance).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Import Button */}
              <button
                onClick={() => onImport(account.id)}
                className="w-full py-2.5 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-400 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import from MT5
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
