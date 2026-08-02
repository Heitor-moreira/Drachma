
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  FileDown, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Calendar,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';

interface Props {
  onImport: (transactions: Transaction[]) => void;
  onClose: () => void;
}

const TemplateImport: React.FC<Props> = ({ onImport, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);
  const [targetMonth, setTargetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const data = [
      ["Dia", "Entradas (R$)", "Saídas (R$)"],
      [1, 500.00, 0],
      [2, 0, 150.50],
      [15, 2000.00, 1200.00]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Dracma");
    
    // Ajustar larguras das colunas
    ws['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 15 }];

    XLSX.writeFile(wb, `Template_Dracma_${targetMonth}.xlsx`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para matriz de strings/números
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rows.length < 2) {
          throw new Error("O arquivo parece estar vazio ou sem cabeçalhos.");
        }

        const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
        
        // Validação de Estrutura de Colunas
        const expected = ["dia", "entradas", "saídas"];
        const hasAllColumns = expected.every(exp => headers.some(h => h.includes(exp)));

        if (!hasAllColumns) {
          throw new Error("Estrutura inválida. Use o template oficial com as colunas: Dia, Entradas e Saídas.");
        }

        const diaIdx = headers.findIndex(h => h.includes("dia"));
        const entIdx = headers.findIndex(h => h.includes("entradas"));
        const saiIdx = headers.findIndex(h => h.includes("saídas"));

        const newTransactions: Transaction[] = [];
        const [year, month] = targetMonth.split('-').map(Number);

        rows.slice(1).forEach((row, index) => {
          const dia = parseInt(row[diaIdx]);
          const entrada = parseFloat(String(row[entIdx] || 0).replace(',', '.'));
          const saida = parseFloat(String(row[saiIdx] || 0).replace(',', '.'));

          // Validação de Dados de Linha
          if (isNaN(dia) || dia < 1 || dia > 31) {
            if (row.length > 0 && row.some(cell => cell !== null && cell !== '')) {
               console.warn(`Linha ${index + 2}: Dia inválido ignora.`);
            }
            return;
          }

          if (isNaN(entrada) || isNaN(saida)) {
            throw new Error(`Valores não numéricos detectados na linha ${index + 2}.`);
          }

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

          if (entrada > 0) {
            newTransactions.push({
              id: `imp-${Date.now()}-in-${index}`,
              description: `Importação: Entrada Dia ${dia}`,
              amount: entrada,
              type: TransactionType.INCOME,
              category: Category.OTHER,
              date: dateStr,
              comment: `Importado via template em ${new Date().toLocaleDateString()}`
            });
          }

          if (saida > 0) {
            newTransactions.push({
              id: `imp-${Date.now()}-out-${index}`,
              description: `Importação: Saída Dia ${dia}`,
              amount: saida,
              type: TransactionType.EXPENSE,
              category: Category.OTHER,
              date: dateStr,
              comment: `Importado via template em ${new Date().toLocaleDateString()}`
            });
          }
        });

        if (newTransactions.length === 0) {
          throw new Error("Nenhum dado financeiro válido encontrado para importar.");
        }

        onImport(newTransactions);
        setSuccess(newTransactions.length);
        setTimeout(() => onClose(), 2000);

      } catch (err: any) {
        setError(err.message || "Erro desconhecido ao processar arquivo.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setError("Erro na leitura do arquivo.");
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#9ce492] text-slate-800 rounded-2xl shadow-sm">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Importação por Template</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Excel / CSV Professional</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Alerta de Mês */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
               <p className="text-xs font-bold text-amber-800">Defina o período de destino</p>
               <p className="text-[10px] text-amber-700 leading-relaxed">
                 Os lançamentos serão registrados no mês e ano selecionados abaixo. Certifique-se de que o template preenchido corresponde a este período.
               </p>
               <input 
                 type="month" 
                 value={targetMonth}
                 onChange={(e) => setTargetMonth(e.target.value)}
                 className="mt-2 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-900 outline-none focus:ring-2 focus:ring-amber-500"
               />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Download Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-slate-300 rounded-full"></span> 1. Baixe o Modelo
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Utilize nosso template oficial para garantir que o sistema reconheça seus dados corretamente.
              </p>
              <button 
                onClick={downloadTemplate}
                className="w-full group bg-slate-100 hover:bg-slate-200 text-slate-700 p-6 rounded-3xl border-2 border-dashed border-slate-300 transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                  <FileDown size={28} className="text-[#5da353]" />
                </div>
                <span className="font-bold text-sm">Download Template</span>
              </button>
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-slate-300 rounded-full"></span> 2. Envie os Dados
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Selecione o arquivo preenchido (.xlsx ou .csv) para processar os lançamentos.
              </p>
              
              <div 
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`w-full p-6 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer
                  ${loading ? 'bg-slate-50 border-slate-200 cursor-wait' : 'bg-emerald-50/30 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                
                {loading ? (
                  <Loader2 className="animate-spin text-emerald-600" size={32} />
                ) : (
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                    <Upload size={28} className="text-emerald-600" />
                  </div>
                )}
                <span className="font-bold text-sm">{loading ? 'Processando...' : 'Fazer Upload'}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={20} className="shrink-0" />
              <p className="text-xs font-bold">Sucesso! {success} lançamentos importados para {targetMonth}.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atenção: Valores duplicados no mesmo dia serão somados no saldo diário.</p>
        </div>
      </div>
    </div>
  );
};

export default TemplateImport;
