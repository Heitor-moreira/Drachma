
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, ChevronRight, HelpCircle, Table, Layers } from 'lucide-react';
import { Transaction } from '../types';
import * as XLSX from 'xlsx';

interface Props {
  onImport: (transactions: Transaction[]) => void;
  onClose: () => void;
}

interface Mapping {
  date: string;
  day: string;
  description: string;
  amount: string;
  income: string;
  expense: string;
}

type ImportStep = 'upload' | 'sheets' | 'mapping';

const ImportModal: React.FC<Props> = ({ onImport, onClose }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[][]>([]);
  const [sheetName, setSheetName] = useState('Planilha Importada');
  const [mapping, setMapping] = useState<Mapping>({
    date: '',
    day: '',
    description: '',
    amount: '',
    income: '',
    expense: ''
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndParseFile = async (file: File) => {
    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');

    if (!isXlsx && !isCsv) {
      setError('Por favor, envie um arquivo .xlsx, .xls ou .csv.');
      return;
    }

    setSheetName(file.name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        
        if (isXlsx) {
          const wb = XLSX.read(data, { type: 'binary' });
          setWorkbook(wb);
          setAvailableSheets(wb.SheetNames);
          
          if (wb.SheetNames.length > 1) {
            setStep('sheets');
          } else {
            handleSheetSelection(wb.SheetNames[0], wb);
          }
        } else {
          const content = data as string;
          const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
          const rows = lines.map(line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim()));
          setupMapping(rows);
        }
        setError(null);
      } catch (err) {
        setError('Erro ao ler o arquivo. Certifique-se de que ele não esteja corrompido.');
      }
    };

    if (isXlsx) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleSheetSelection = (selectedName: string, wb: XLSX.WorkBook | null = workbook) => {
    if (!wb) return;
    const worksheet = wb.Sheets[selectedName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    setupMapping(rows);
  };

  const setupMapping = (rows: any[][]) => {
    if (rows.length < 2) {
      setError('O arquivo ou aba selecionada não contém uma tabela válida.');
      return;
    }

    const extractedHeaders = rows[0].map(h => String(h || '').trim());
    const hasValidHeaders = extractedHeaders.some(h => h.length > 0);
    
    if (!hasValidHeaders) {
      setError('Não foi possível identificar um cabeçalho na primeira linha.');
      return;
    }

    setHeaders(extractedHeaders);
    setRawData(rows.slice(1));
    
    // Auto-mapping
    const newMapping = { ...mapping };
    extractedHeaders.forEach(h => {
      const header = h.toLowerCase();
      if (header === 'dia' || header === 'day') newMapping.day = h;
      if (header.includes('data') || header.includes('date')) newMapping.date = h;
      if (header.includes('desc') || header.includes('nome')) newMapping.description = h;
      if (header.includes('valor') || header.includes('amount')) newMapping.amount = h;
      if (header.includes('entrada') || header.includes('income') || header.includes('receita')) newMapping.income = h;
      if (header.includes('saida') || header.includes('saída') || header.includes('expense') || header.includes('despesa')) newMapping.expense = h;
    });

    setMapping(newMapping);
    setStep('mapping');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndParseFile(file);
  };

  const processImport = () => {
    try {
      const batchId = `batch-${Date.now()}`;
      const importDate = new Date().toISOString();
      const currentYearMonth = new Date().toISOString().slice(0, 7);

      const transactions: Transaction[] = [];

      rawData.forEach((row, idx) => {
        const descColIdx = headers.indexOf(mapping.description);
        if (descColIdx === -1) return;

        const desc = String(row[descColIdx] || 'Sem descrição');
        let date = new Date().toISOString().split('T')[0];
        if (mapping.date && row[headers.indexOf(mapping.date)]) {
          let rawDate = row[headers.indexOf(mapping.date)];
          if (typeof rawDate === 'number') {
            const d = new Date((rawDate - 25569) * 86400 * 1000);
            date = d.toISOString().split('T')[0];
          } else {
            date = String(rawDate);
            if (date.includes('/')) {
              const [d, m, y] = date.split('/');
              date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
          }
        } else if (mapping.day && row[headers.indexOf(mapping.day)]) {
          const day = String(row[headers.indexOf(mapping.day)]).padStart(2, '0');
          date = `${currentYearMonth}-${day}`;
        }

        const parseVal = (val: any) => {
          if (typeof val === 'number') return val;
          return parseFloat(String(val || '0').replace(/[R$\s.]/g, '').replace(',', '.'));
        };

        if (mapping.income || mapping.expense) {
          const inc = mapping.income ? parseVal(row[headers.indexOf(mapping.income)]) : 0;
          const exp = mapping.expense ? parseVal(row[headers.indexOf(mapping.expense)]) : 0;

          if (inc > 0) {
            transactions.push({
              id: `in-${batchId}-${idx}`,
              description: desc,
              amount: inc,
              entryType: 'INCOME',
              date, comment: `Importado de ${sheetName}`, batchId, batchName: sheetName, importDate
            });
          }
          if (exp > 0) {
            transactions.push({
              id: `out-${batchId}-${idx}`,
              description: desc,
              amount: exp,
              entryType: 'EXPENSE',
              date, comment: `Importado de ${sheetName}`, batchId, batchName: sheetName, importDate
            });
          }
        } else {
          const amount = parseVal(row[headers.indexOf(mapping.amount)]);
          if (amount !== 0) {
            transactions.push({
              id: `val-${batchId}-${idx}`,
              description: desc,
              amount: Math.abs(amount),
              entryType: amount > 0 ? 'INCOME' : 'EXPENSE',
              date, comment: `Importado de ${sheetName}`, batchId, batchName: sheetName, importDate
            });
          }
        }
      });

      if (transactions.length === 0) {
        setError('Nenhum dado financeiro válido encontrado na tabela.');
        return;
      }

      onImport(transactions);
      onClose();
    } catch (err) {
      setError('Erro ao processar mapeamento. Verifique se as colunas selecionadas contêm dados numéricos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Table size={20} className="text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-lg">Importar Tabela Estruturada</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm flex gap-2 border border-rose-100">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'upload' && (
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx,.xls,.csv" 
                className="hidden" 
              />
              <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FileText size={40} className="text-indigo-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-700">Selecione seu Arquivo Excel ou CSV</h4>
              <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                Formatos aceitos: <b>.xlsx, .xls, .csv</b>.<br/>
                O arquivo deve conter uma tabela estruturada.
              </p>
            </div>
          )}

          {step === 'sheets' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={18} className="text-indigo-600" />
                <h4 className="font-bold text-slate-700">Selecione a aba desejada</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableSheets.map(name => (
                  <button
                    key={name}
                    onClick={() => handleSheetSelection(name)}
                    className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group"
                  >
                    <div className="bg-white p-2 rounded-lg border border-slate-100 group-hover:bg-indigo-100 group-hover:border-indigo-200 transition-colors">
                      <Table size={16} className="text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-indigo-700 truncate">{name}</span>
                  </button>
                ))}
              </div>
              <div className="pt-6 border-t">
                <button onClick={() => setStep('upload')} className="text-slate-400 font-bold text-sm hover:text-slate-600">Voltar</button>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="text-xs font-medium text-emerald-800">Tabela estruturada detectada: {headers.length} colunas encontradas.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Mapeamento de Tempo</h5>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Data Completa</label>
                    <select onChange={e => setMapping({...mapping, date: e.target.value})} value={mapping.date} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">-- Selecione a coluna --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="flex items-center gap-2 py-1">
                      <div className="h-px bg-slate-100 flex-1"></div>
                      <span className="text-xs font-bold text-slate-300">OU</span>
                      <div className="h-px bg-slate-100 flex-1"></div>
                    </div>
                    <label className="block text-xs font-bold text-slate-400 uppercase">Apenas o Dia</label>
                    <select onChange={e => setMapping({...mapping, day: e.target.value})} value={mapping.day} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">-- Selecione a coluna --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Mapeamento Financeiro</h5>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Descrição</label>
                    <select onChange={e => setMapping({...mapping, description: e.target.value})} value={mapping.description} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">-- Selecione a coluna --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-400 uppercase">Entradas</label>
                        <select onChange={e => setMapping({...mapping, income: e.target.value})} value={mapping.income} className="w-full p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs outline-none">
                          <option value="">-- Coluna --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-400 uppercase">Saídas</label>
                        <select onChange={e => setMapping({...mapping, expense: e.target.value})} value={mapping.expense} className="w-full p-2 bg-rose-50 border border-rose-100 rounded-lg text-xs outline-none">
                          <option value="">-- Coluna --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t flex justify-between items-center">
                <button 
                  onClick={() => workbook ? setStep('sheets') : setStep('upload')} 
                  className="text-slate-400 font-bold text-sm hover:text-slate-600 px-4"
                >
                  Voltar
                </button>
                <button 
                  onClick={processImport} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                >
                  Finalizar Importação <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
