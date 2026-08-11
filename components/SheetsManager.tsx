
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Trash2, ChevronDown, ChevronUp, FileSpreadsheet, Calendar, Hash, ArrowRightLeft, AlertTriangle, AlertCircle } from 'lucide-react';
import { getTransactionEntryType } from '../finance';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onDeleteBatch: (batchId: string) => void;
}

const SheetsManager: React.FC<Props> = ({ transactions, onDelete, onDeleteBatch }) => {
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<string | null>(null);

  const batches = useMemo(() => {
    const map: Record<string, { id: string; name: string; date: string; items: Transaction[] }> = {};
    
    transactions.forEach(t => {
      if (t.batchId) {
        if (!map[t.batchId]) {
          map[t.batchId] = {
            id: t.batchId,
            name: t.batchName || 'Sem Nome',
            date: t.importDate || t.date,
            items: []
          };
        }
        map[t.batchId].items.push(t);
      }
    });

    return Object.values(map).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const toggleBatch = (id: string) => {
    setExpandedBatch(expandedBatch === id ? null : id);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setConfirmDelete(null);
  };

  const handleDeleteBatch = (batchId: string) => {
    onDeleteBatch(batchId);
    setConfirmDeleteBatch(null);
  };

  if (batches.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
        <FileSpreadsheet size={64} className="mx-auto text-slate-200 mb-6" />
        <h3 className="text-2xl font-bold text-slate-700 mb-2">Nenhuma Planilha Importada</h3>
        <p className="text-slate-400 max-w-sm mx-auto">
          Utilize o botão "Importar Planilha" no topo para carregar dados do Google Sheets ou CSV.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 text-indigo-700">
        <AlertTriangle size={20} className="shrink-0" />
        <p className="text-xs font-medium">
          Nesta seção você pode gerenciar os lançamentos agrupados por arquivo de importação. 
          A exclusão de uma planilha removerá todos os seus lançamentos e afetará o saldo global.
        </p>
      </div>

      <div className="grid gap-4">
        {batches.map(batch => (
          <div key={batch.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all">
            <div 
              className={`p-6 flex items-center justify-between transition-colors ${expandedBatch === batch.id ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
            >
              <div 
                onClick={() => toggleBatch(batch.id)}
                className="flex items-center gap-4 cursor-pointer flex-1"
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{batch.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(batch.date).toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1"><Hash size={12} /> {batch.items.length} lançamentos</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Impacto no Saldo</p>
                  <p className={`font-bold ${batch.items.reduce((acc, i) => getTransactionEntryType(i) === 'INCOME' ? acc + i.amount : acc - i.amount, 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    R$ {Math.abs(batch.items.reduce((acc, i) => getTransactionEntryType(i) === 'INCOME' ? acc + i.amount : acc - i.amount, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {confirmDeleteBatch === batch.id ? (
                    <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded-xl border border-rose-100 animate-in fade-in zoom-in duration-200">
                      <AlertCircle size={14} className="text-rose-600 hidden xs:block" />
                      <span className="text-xs font-bold text-rose-600 whitespace-nowrap">Excluir tudo?</span>
                      <button 
                        onClick={() => handleDeleteBatch(batch.id)} 
                        className="bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
                      >
                        Sim
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteBatch(null)} 
                        className="text-slate-400 hover:text-slate-600 px-2 text-xs font-bold"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setConfirmDeleteBatch(batch.id)}
                      className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Excluir planilha completa"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => toggleBatch(batch.id)}
                    className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    {expandedBatch === batch.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {expandedBatch === batch.id && (
              <div className="border-t border-slate-100 overflow-x-auto animate-in slide-in-from-top-2 duration-300">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Data</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Descrição</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Categoria</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Valor</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {batch.items.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                          {new Date(t.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">{t.description}</p>
                          {t.comment && <p className="text-xs text-slate-400 truncate max-w-[200px]">{t.comment}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: '#e2e8f0', color: '#334155' }}>
                            {t.entryType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${getTransactionEntryType(t) === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {getTransactionEntryType(t) === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          {confirmDelete === t.id ? (
                            <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2">
                              <button onClick={() => setConfirmDelete(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
                              <button onClick={() => handleDelete(t.id)} className="bg-rose-500 text-white px-2 py-1 rounded-md text-xs font-bold">Excluir</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setConfirmDelete(t.id)}
                              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SheetsManager;
