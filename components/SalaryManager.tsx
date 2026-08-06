
import React, { useState, useMemo } from 'react';
import { SalaryInfo, SalaryDiscount } from '../types';
import { Wallet, Plus, Trash2, Calculator, Info, Landmark, Percent, DollarSign } from 'lucide-react';

interface Props {
  salaryInfo: SalaryInfo;
  onUpdate: (data: SalaryInfo) => void;
  currencySymbol: string;
}

const SalaryManager: React.FC<Props> = ({ salaryInfo, onUpdate, currencySymbol }) => {
  const [newDiscountName, setNewDiscountName] = useState('');
  const [newDiscountAmount, setNewDiscountAmount] = useState('');
  const [discountType, setDiscountType] = useState<'VALUE' | 'PERCENT'>('VALUE');

  const totalDiscounts = useMemo(() => {
    return salaryInfo.discounts.reduce((acc, d) => {
      if (d.type === 'PERCENT') {
        return acc + (salaryInfo.gross * (d.amount / 100));
      }
      return acc + d.amount;
    }, 0);
  }, [salaryInfo.discounts, salaryInfo.gross]);

  const netSalary = salaryInfo.gross - totalDiscounts;

  const handleGrossChange = (val: number) => {
    onUpdate({ ...salaryInfo, gross: val });
  };

  const addDiscount = () => {
    if (!newDiscountName || !newDiscountAmount) return;
    const discount: SalaryDiscount = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDiscountName,
      amount: parseFloat(newDiscountAmount),
      type: discountType
    };
    onUpdate({
      ...salaryInfo,
      discounts: [...salaryInfo.discounts, discount]
    });
    setNewDiscountName('');
    setNewDiscountAmount('');
  };

  const removeDiscount = (id: string) => {
    onUpdate({
      ...salaryInfo,
      discounts: salaryInfo.discounts.filter(d => d.id !== id)
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transition-colors">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-theme/10 dark:bg-theme/10 text-theme rounded-2xl">
              <Landmark size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Meu Salário</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">Configure seus ganhos brutos e descontos recorrentes</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-widest">Salário Bruto (Mensal)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-600 text-lg">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={salaryInfo.gross || ''}
                  onChange={e => handleGrossChange(parseFloat(e.target.value) || 0)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-theme/20 focus:border-theme outline-none text-2xl font-bold text-slate-800 dark:text-white transition-all"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-6 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-2xl">
                <span className="text-xs font-bold text-rose-400 dark:text-rose-500 uppercase tracking-widest block mb-1">Total de Descontos</span>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-500">- {currencySymbol} {totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-6 bg-theme/10 dark:bg-theme/5 border border-theme/30 dark:border-theme/20 rounded-2xl">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Salário Líquido Real</span>
                <p className="text-2xl font-bold text-slate-800 dark:text-theme">{currencySymbol} {netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">Detalhamento de Descontos</h4>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold uppercase">{salaryInfo.discounts.length} Itens</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
            {salaryInfo.discounts.length === 0 ? (
              <div className="p-12 text-center">
                <Info size={40} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                <p className="text-slate-400 dark:text-slate-600 text-sm italic">Nenhum desconto registrado (Ex: INSS, Plano de Saúde...)</p>
              </div>
            ) : (
              salaryInfo.discounts.map(discount => {
                const absoluteAmount = discount.type === 'PERCENT' 
                  ? (salaryInfo.gross * (discount.amount / 100))
                  : discount.amount;
                
                return (
                  <div key={discount.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{discount.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">
                        {discount.type === 'PERCENT' ? `${discount.amount}% do Bruto` : 'Valor Fixo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-rose-500">{currencySymbol} {absoluteAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <button 
                        onClick={() => removeDiscount(discount.id)}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Plus size={20} className="text-theme" /> Novo Desconto
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-widest">Tipo de Desconto</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl transition-colors">
                <button
                  type="button"
                  onClick={() => setDiscountType('VALUE')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${discountType === 'VALUE' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  <DollarSign size={14} /> Valor Fixo
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('PERCENT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${discountType === 'PERCENT' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  <Percent size={14} /> Percentual
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome do Desconto</label>
              <input
                type="text"
                value={newDiscountName}
                onChange={e => setNewDiscountName(e.target.value)}
                placeholder="Ex: INSS, Plano de Saúde..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-theme outline-none text-sm dark:text-slate-200 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                {discountType === 'VALUE' ? `Valor (${currencySymbol})` : 'Porcentagem (%)'}
              </label>
              <input
                type="number"
                value={newDiscountAmount}
                onChange={e => setNewDiscountAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-theme outline-none text-sm font-bold dark:text-slate-200 transition-colors"
              />
            </div>
            <button
              onClick={addDiscount}
              className="w-full bg-theme hover:bg-theme-dark text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Calculator size={18} />
              Aplicar Desconto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryManager;
