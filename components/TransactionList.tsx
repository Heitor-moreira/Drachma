
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2, Search, Filter, Calendar, Tag, CreditCard, Edit2 } from 'lucide-react';
import { CATEGORY_COLORS } from '../constants';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

// Função auxiliar para interpretar data como local e evitar deslocamento de fuso horário
const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Retorna uma data ao meio-dia para evitar problemas com mudanças de fuso no navegador
  return new Date(year, month - 1, day, 12, 0, 0);
};

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.comment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'ALL' || t.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchTerm, filterType]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  // Ordenação das chaves de data usando a função local para garantir integridade
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    return parseLocalDate(b).getTime() - parseLocalDate(a).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar transações ou comentários..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#9ce492] outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilterType('ALL')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'ALL' ? 'bg-[#9ce492] text-slate-800 shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Todos</button>
          <button onClick={() => setFilterType(TransactionType.INCOME)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === TransactionType.INCOME ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Receitas</button>
          <button onClick={() => setFilterType(TransactionType.EXPENSE)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === TransactionType.EXPENSE ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Despesas</button>
        </div>
      </div>

      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-slate-500 font-medium">Nenhum lançamento encontrado</h3>
          </div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
                <span className="w-1 h-3 bg-[#9ce492] rounded-full"></span>
                {parseLocalDate(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h4>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {groupedByDate[date].map(t => (
                    <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${CATEGORY_COLORS[t.category]}15`, color: CATEGORY_COLORS[t.category] }}>
                        {t.isInstallment ? <CreditCard size={18}/> : <Tag size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-800 truncate">{t.description}</h5>
                          {t.installmentInfo && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                              {t.installmentInfo.current}/{t.installmentInfo.total}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter" style={{ backgroundColor: `${CATEGORY_COLORS[t.category]}20`, color: CATEGORY_COLORS[t.category] }}>
                            {t.category}
                          </span>
                        </div>
                        {t.comment && <p className="text-xs text-slate-400 truncate">{t.comment}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => onEdit(t)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;
