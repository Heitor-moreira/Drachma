
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, SalaryInfo } from '../types';
import { Sparkles, X, BrainCircuit, Loader2, Lightbulb, TrendingDown, Target } from 'lucide-react';

interface Props {
  isOpen: boolean;
  transactions: Transaction[];
  salaryInfo: SalaryInfo;
  onClose: () => void;
}

const AiInsights: React.FC<Props> = ({ isOpen, transactions, salaryInfo, onClose }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const totalDiscounts = salaryInfo.discounts.reduce((acc, d) => {
        if (d.type === 'PERCENT') return acc + (salaryInfo.gross * (d.amount / 100));
        return acc + d.amount;
      }, 0);
      const netSalary = salaryInfo.gross - totalDiscounts;

      const summary = transactions.slice(0, 50).map(t => ({
        desc: t.description,
        val: t.amount,
        type: t.type,
        cat: t.category,
        fixed: t.isFixed,
        inst: t.isInstallment
      }));

      const prompt = `
        Analise o perfil financeiro deste usuário e forneça 3 orientações estratégicas de economia e organização.
        Contexto:
        - Salário Líquido: R$ ${netSalary.toLocaleString('pt-BR')}
        - Lançamentos recentes: ${JSON.stringify(summary)}
        
        Considere:
        1. Comprometimento de gastos fixos vs salário.
        2. Alerta sobre excesso de parcelamentos (se houver).
        3. Dica de economia em categorias específicas.
        
        Responda em tom amigável e profissional, usando markdown leve (negrito para valores).
        Máximo 200 palavras.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      setInsight(response.text || "Não foi possível gerar insights no momento.");
    } catch (error) {
      console.error(error);
      setInsight("Houve um erro na consultoria. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !insight) {
      generateInsights();
    }
  }, [isOpen]);

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[80] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Painel Lateral (Drawer) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[90] transition-transform duration-500 ease-in-out border-l border-slate-200 dark:border-slate-800 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-theme text-white rounded-xl shadow-lg">
              <BrainCircuit size={20} className={loading ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h3 className="font-bold">Consultoria de IA</h3>
              <p className="text-[10px] font-black text-theme uppercase tracking-widest">Dracma Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar dark:bg-slate-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Loader2 className="animate-spin text-theme" size={48} />
                <Sparkles size={20} className="absolute -top-1 -right-1 text-theme animate-bounce" />
              </div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Analisando sua saúde financeira...</p>
            </div>
          ) : (
            <>
              {insight && (
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-3xl text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-theme" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">Principais Insights</span>
                  </div>
                  {insight}
                </div>
              )}

              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-lg shrink-0"><Lightbulb size={16} /></div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">Dica: Gastos fixos que superam 50% do salário líquido podem comprometer sua capacidade de investimento e lazer.</p>
                </div>
                <div className="p-4 bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-100 dark:border-rose-500/10 flex items-start gap-3">
                  <div className="p-1.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500 rounded-lg shrink-0"><TrendingDown size={16} /></div>
                  <p className="text-[11px] text-rose-800 dark:text-rose-200 font-medium leading-relaxed">Cuidado: Compras parceladas dão a ilusão de caixa sobrando. Mantenha o total de parcelas sob 30% do seu ganho.</p>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-500 rounded-lg shrink-0"><Target size={16} /></div>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-200 font-medium leading-relaxed">Estratégia: Tente aplicar a regra 50-30-20 (50% fixos, 30% lazer, 20% reserva).</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-4 shrink-0">
          <button 
            onClick={generateInsights}
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-theme text-white font-bold py-3 rounded-2xl transition-all active:scale-95 hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <Sparkles size={16} className="text-theme dark:text-white" />
            Atualizar Consultoria
          </button>
          <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest leading-none">Dados processados localmente com Gemini 3 Pro</p>
        </div>
      </div>
    </>
  );
};

export default AiInsights;
