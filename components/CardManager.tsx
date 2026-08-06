import React, { useState } from 'react';
import { CreditCard as CreditCardIcon, Pencil, Trash2 } from 'lucide-react';
import { CreditCard } from '../types';

interface Props { cards: CreditCard[]; onChange: (cards: CreditCard[]) => void; currencySymbol: string; }

const emptyForm = { name: '', bank: '', brand: '', lastFour: '', color: '#35b784', type: 'CREDIT' as CreditCard['type'], limit: '', closingDay: '1', dueDay: '10' };

const CardManager: React.FC<Props> = ({ cards, onChange, currencySymbol }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const set = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.bank.trim()) return;
    const card: CreditCard = {
      id: editingId || Math.random().toString(36).slice(2), name: form.name.trim(), bank: form.bank.trim(),
      brand: form.brand.trim(), lastFour: form.lastFour.replace(/\D/g, '').slice(-4), color: form.color,
      type: form.type, isActive: true,
      ...(form.type === 'CREDIT' ? { limit: Number(form.limit) || 0, closingDay: Math.min(31, Math.max(1, Number(form.closingDay) || 1)), dueDay: Math.min(31, Math.max(1, Number(form.dueDay) || 10)) } : {})
    };
    onChange(editingId ? cards.map(item => item.id === editingId ? card : item) : [...cards, card]);
    reset();
  };

  const edit = (card: CreditCard) => setForm({ ...emptyForm, name: card.name, bank: card.bank, brand: card.brand || '', lastFour: card.lastFour || '', color: card.color || '#35b784', type: card.type || 'CREDIT', limit: card.limit ? String(card.limit) : '', closingDay: String(card.closingDay || 1), dueDay: String(card.dueDay || 10) });

  return <div className="space-y-6">
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-800 dark:text-white">{editingId ? 'Editar cartão' : 'Cadastrar cartão'}</h3>{editingId && <button type="button" onClick={reset} className="text-xs font-bold text-slate-400">Cancelar</button>}</div>
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do cartão" className="field" required />
        <input value={form.bank} onChange={e => set('bank', e.target.value)} placeholder="Banco ou instituição" className="field" required />
        <select value={form.type} onChange={e => set('type', e.target.value)} className="field"><option value="CREDIT">Crédito</option><option value="DEBIT">Débito</option></select>
        <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Bandeira (Visa, Elo...)" className="field" />
        <input value={form.lastFour} onChange={e => set('lastFour', e.target.value)} placeholder="Últimos 4 dígitos" maxLength={4} className="field" />
        <input type="color" value={form.color} onChange={e => set('color', e.target.value)} title="Cor do cartão" className="field h-11 p-1" />
        {form.type === 'CREDIT' && <>
          <input type="number" min="0" step="0.01" value={form.limit} onChange={e => set('limit', e.target.value)} placeholder={`Limite (${currencySymbol})`} className="field" required />
          <input type="number" min="1" max="31" value={form.closingDay} onChange={e => set('closingDay', e.target.value)} placeholder="Fechamento" className="field" required />
          <input type="number" min="1" max="31" value={form.dueDay} onChange={e => set('dueDay', e.target.value)} placeholder="Vencimento" className="field" required />
        </>}
        <button className="md:col-span-3 bg-theme text-white rounded-xl font-bold py-3">{editingId ? 'Salvar cartão' : 'Adicionar cartão'}</button>
      </form>
      <p className="text-xs text-slate-400 mt-3">Limite, fechamento e vencimento são usados apenas para cartões de crédito.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{cards.map(card => <div key={card.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between" style={{ borderTopColor: card.color, borderTopWidth: 4 }}><div className="flex items-center gap-3"><div className="p-3 rounded-xl text-white" style={{ backgroundColor: card.color || '#35b784' }}><CreditCardIcon size={20} /></div><div><p className="font-bold dark:text-white">{card.name}</p><p className="text-xs text-slate-400">{card.bank} · {card.type === 'CREDIT' ? 'Crédito' : 'Débito'}{card.lastFour ? ` · •••• ${card.lastFour}` : ''}</p></div></div><div className="text-right">{card.type === 'CREDIT' && <p className="font-bold dark:text-white">{currencySymbol} {(card.limit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}<div className="flex gap-2 justify-end mt-1"><button onClick={() => { setEditingId(card.id); edit(card); }} className="text-xs text-theme"><Pencil size={14} /></button><button onClick={() => onChange(cards.filter(c => c.id !== card.id))} className="text-xs text-rose-500"><Trash2 size={14} /></button></div></div></div>)}</div>
    <style>{`.field{width:100%;padding:.65rem .75rem;border:1px solid rgb(226 232 240);border-radius:.75rem;background:transparent;color:inherit;outline:none}.dark .field{border-color:rgb(51 65 85);background-color:rgb(30 41 59)}.field:focus{box-shadow:0 0 0 2px #9ce492}`}</style>
  </div>;
};
export default CardManager;
