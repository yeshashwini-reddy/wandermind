import React, { useState } from 'react';
import { PlusCircle, Receipt, ArrowRight, ShieldCheck } from 'lucide-react';
import { addExpenseApi } from '../api/client';
import { useTripStore } from '../store/tripStore';
import toast from 'react-hot-toast';

export const ExpenseTracker = ({ tripId, expenses = [], onExpenseAdded }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState('Rajesh');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Food', 'Travel', 'Stay', 'Activities', 'Emergency'];
  const members = ['Rajesh', 'Priya', 'Parents', 'Rohan'];

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amount || Number(amount) <= 0) {
      toast.error('Please enter valid expense details');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedLiveState = await addExpenseApi({
        trip_id: tripId,
        category,
        description,
        amount: parseFloat(amount),
        paid_by: paidBy,
        split_among: members
      });

      setDescription('');
      setAmount('');
      toast.success(`Logged ₹${amount} for ${category}!`);
      if (onExpenseAdded) onExpenseAdded(updatedLiveState);
    } catch (err) {
      console.error(err);
      toast.error('Failed to log expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Quick Live Expense Entry
            </h4>
            <p className="text-xs text-slate-400">Guardian tracks real-time budget burn rate</p>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
        <input
          type="text"
          placeholder="Description (e.g. Lunch thali)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
        />

        <input
          type="number"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
        >
          {members.map((m) => (
            <option key={m} value={m}>Paid by: {m}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold flex items-center justify-center space-x-1 shadow-md shadow-primary-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isSubmitting ? 'Logging...' : 'Add Spend'}</span>
        </button>
      </form>

      {/* Recent Expenses List */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Recent Trip Expenses
        </span>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {expenses.map((exp, idx) => (
            <div
              key={exp.id || idx}
              className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">{exp.description}</span>
                <span className="block text-[10px] text-slate-400 font-mono">
                  {exp.category} • Paid by {exp.paid_by} • {exp.timestamp}
                </span>
              </div>
              <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                ₹{Number(exp.amount).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
