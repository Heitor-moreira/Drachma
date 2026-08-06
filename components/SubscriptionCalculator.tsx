
import React, { useState } from 'react';
import { Subscription } from '../types';
import { Plus, Trash2, Wallet, PieChart, CreditCard, Edit2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  subscriptions: Subscription[];
  setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>;
  baseSalary: number;
  currencySymbol: string;
}

const SubscriptionCalculator: React.FC<Props> = ({ subscriptions, setSubscriptions, baseSalary, currencySymbol }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const totalMonthlyActive = subscriptions.filter(s => s.isActive).reduce((acc, s) => acc + s.amount, 0);
  const percentageOfSalary = baseSalary > 0 ? (totalMonthlyActive / baseSalary) * 100 : 0;

  const saveSubscription = () => {
    if (!newName || !newAmount) return;
    if (editingId) {
      setSubscriptions(prev => prev.map(s => s.id === editingId ? { ...s, name: newName, amount: parseFloat(newAmount) } : s));
      setEditingId(null);
    } else {
      setSubscriptions(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: newName, amount: parseFloat(newAmount), isActive: true }]);
    }
    setNewName('');
    setNewAmount('');
  };

  const toggleStatus = (id: string) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const startEdit = (sub: Subscription) => {
    setEditingId(sub.id);
    setNewName(sub.name);
    setNewAmount(sub.amount.toString());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 transition-colors">
      <div className="bg-white dark:bg-dark-app-surface p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-app-border h-fit transition-colors">
        <h3 className="text-lg font-bold text-slate-800 dark:text-dark-app-text-primary mb-6 flex items-center gap-2">
          <Plus size={20} className="text-[#35b784]" /> {editingId ? 'Editar Assinatura' : 'Nova Assinatura'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1">Serviço</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-xl outline-none dark:text-dark-app-text-secondary transition-colors" placeholder="Netflix, Disney+, VPN..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1">Valor Mensal ({currencySymbol})</label>
            <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-xl outline-none font-bold dark:text-dark-app-text-secondary transition-colors" placeholder="0,00" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveSubscription} className="flex-1 bg-[#35b784] hover:bg-[#2B996D] text-slate-800 font-bold py-4 rounded-2xl transition-all shadow-md active:scale-95 uppercase text-xs">
              {editingId ? 'Salvar Edição' : 'Adicionar Assinatura'}
            </button>
            {editingId && <button onClick={() => {setEditingId(null); setNewName(''); setNewAmount('')}} className="px-4 bg-slate-100 dark:bg-dark-app-surface-secondary rounded-2xl text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-app-surface p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-app-border transition-colors">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-dark-app-text-primary flex items-center gap-2"><CreditCard size={20} className="text-[#35b784]" /> Minhas Assinaturas</h3>
          <span className="bg-[#35b784]/20 text-slate-700 dark:text-[#35b784] px-3 py-1 rounded-full text-xs font-bold">{subscriptions.length} Listadas</span>
        </div>

        <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {subscriptions.map(s => (
            <div key={s.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${s.isActive ? 'bg-slate-50 dark:bg-dark-app-surface-secondary/50 border-slate-100 dark:border-dark-app-border' : 'bg-slate-100/50 dark:bg-dark-app-surface border-slate-200 dark:border-dark-app-border opacity-60 grayscale'}`}>
              <div className="flex items-center gap-4">
                <button onClick={() => toggleStatus(s.id)} className={`p-2 rounded-xl transition-all ${s.isActive ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-400 bg-slate-100 dark:bg-dark-app-surface-secondary'}`}>
                  {s.isActive ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </button>
                <div>
                  <h5 className="font-bold text-slate-700 dark:text-dark-app-text-secondary">{s.name}</h5>
                  <p className="text-xs font-bold uppercase tracking-tighter text-slate-400 dark:text-dark-app-text-secondary">{s.isActive ? 'Ativa' : 'Pausada'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 dark:text-dark-app-text-primary">{currencySymbol} {s.amount.toLocaleString('pt-BR')}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(s)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => setSubscriptions(prev => prev.filter(x => x.id !== s.id))} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
          {subscriptions.length === 0 && (
            <div className="py-12 text-center">
               <CreditCard size={40} className="mx-auto text-slate-200 dark:text-dark-app-text-secondary mb-4" />
               <p className="text-slate-400 dark:text-dark-app-text-secondary font-bold italic">Nenhuma assinatura cadastrada.</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-dark-app-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#35b784] text-slate-800 rounded-xl shadow-lg shadow-emerald-200/50"><PieChart size={20} /></div>
              <div>
                <span className="text-slate-500 dark:text-dark-app-text-secondary text-xs font-bold uppercase tracking-widest block">Impacto de Assinaturas Ativas</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-[#35b784]">{percentageOfSalary.toFixed(1)}% <small className="text-xs text-slate-400 dark:text-dark-app-text-secondary font-bold uppercase">do Salário</small></span>
              </div>
            </div>
            <div className="text-right">
               <span className="text-xs font-bold text-slate-400 dark:text-dark-app-text-secondary uppercase block">Total Mensal</span>
               <span className="font-bold text-slate-700 dark:text-dark-app-text-secondary">{currencySymbol} {totalMonthlyActive.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCalculator;
