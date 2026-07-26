import React, { useState } from 'react';
import { CreditCard } from '../types';

interface Props { cards: CreditCard[]; onChange: (cards: CreditCard[]) => void; currencySymbol: string; }

const CardManager: React.FC<Props> = ({ cards, onChange, currencySymbol }) => {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [limit, setLimit] = useState('');
  const [dueDay, setDueDay] = useState('10');

  const addCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bank.trim() || !limit) return;
    onChange([...cards, { id: Math.random().toString(36).slice(2), name: name.trim(), bank: bank.trim(), limit: Number(limit), dueDay: Math.min(31, Math.max(1, Number(dueDay) || 10)), isActive: true }]);
    setName(''); setBank(''); setLimit('');
  };

  return <div className="space-y-6">
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
      <h3 className="font-bold text-slate-800 dark:text-white mb-4">Cadastrar cartão de crédito</h3>
      <form onSubmit={addCard} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cartão" className="px-3 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700" />
        <input value={bank} onChange={e => setBank(e.target.value)} placeholder="Banco" className="px-3 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700" />
        <input type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder={`Limite (${currencySymbol})`} className="px-3 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700" />
        <div className="flex gap-2"><input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-20 px-3 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700" /><button className="flex-1 bg-theme text-white rounded-xl font-bold">Adicionar</button></div>
      </form>
      <p className="text-[10px] text-slate-400 mt-2">O número ao lado do botão é o dia de vencimento da fatura.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{cards.map(card => <div key={card.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"><div><p className="font-bold dark:text-white">{card.name}</p><p className="text-xs text-slate-400">{card.bank} · vence dia {card.dueDay}</p></div><div className="text-right"><p className="font-black dark:text-white">{currencySymbol} {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><button onClick={() => onChange(cards.filter(c => c.id !== card.id))} className="text-xs text-rose-500">Excluir</button></div></div>)}</div>
  </div>;
};
export default CardManager;
