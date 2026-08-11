
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Category, Transaction } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { getTransactionEntryType } from '../finance';
import { TrendingUp, TrendingDown, Landmark, Percent, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  baseSalary: number;
  currencySymbol: string;
}

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

const formatDateToISO = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const CustomDatePicker: React.FC<{ 
  label: string, 
  value: string, 
  onChange: (val: string) => void 
}> = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const date = parseLocalDate(value);
  
  const [editDay, setEditDay] = useState(String(date.getDate()).padStart(2, '0'));
  const [editMonth, setEditMonth] = useState(String(date.getMonth() + 1).padStart(2, '0'));
  const [editYear, setEditYear] = useState(String(date.getFullYear()));

  const [viewDate, setViewDate] = useState(new Date(date.getFullYear(), date.getMonth(), 1));

  useEffect(() => {
    setEditDay(String(date.getDate()).padStart(2, '0'));
    setEditMonth(String(date.getMonth() + 1).padStart(2, '0'));
    setEditYear(String(date.getFullYear()));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldChange = (field: 'd' | 'm' | 'y', val: string) => {
    let d = editDay, m = editMonth, y = editYear;
    if (field === 'd') { d = val.slice(0, 2); setEditDay(d); }
    if (field === 'm') { m = val.slice(0, 2); setEditMonth(m); }
    if (field === 'y') { y = val.slice(0, 4); setEditYear(y); }

    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const newDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
      if (!isNaN(newDate.getTime())) {
        onChange(formatDateToISO(newDate));
      }
    }
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [viewDate]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-400 dark:text-dark-app-text-secondary uppercase leading-none mb-1">{label}</span>
        <div className="flex items-center gap-1 bg-white dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-theme">
          <input type="text" value={editDay} onChange={(e) => handleFieldChange('d', e.target.value)} className="w-5 text-xs font-bold text-slate-700 dark:text-dark-app-text-secondary outline-none bg-transparent text-center" maxLength={2} />
          <span className="text-slate-300 dark:text-dark-app-text-secondary">/</span>
          <input type="text" value={editMonth} onChange={(e) => handleFieldChange('m', e.target.value)} className="w-5 text-xs font-bold text-slate-700 dark:text-dark-app-text-secondary outline-none bg-transparent text-center" maxLength={2} />
          <span className="text-slate-300 dark:text-dark-app-text-secondary">/</span>
          <input type="text" value={editYear} onChange={(e) => handleFieldChange('y', e.target.value)} className="w-10 text-xs font-bold text-slate-700 dark:text-dark-app-text-secondary outline-none bg-transparent text-center" maxLength={4} />
          <button onClick={() => setIsOpen(!isOpen)} className="ml-1 text-slate-400 hover:text-theme dark:text-dark-app-text-secondary"><CalendarIcon size={12} /></button>
        </div>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-dark-app-surface-secondary rounded-2xl shadow-2xl border border-slate-100 dark:border-dark-app-border p-4 w-64 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg dark:text-dark-app-text-secondary"><ChevronLeft size={16}/></button>
            <span className="text-xs font-bold text-slate-700 dark:text-dark-app-text-secondary">{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg dark:text-dark-app-text-secondary"><ChevronRight size={16}/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <span key={d} className="text-xs font-bold text-slate-400 dark:text-dark-app-text-secondary">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <button
                key={i}
                disabled={!day}
                onClick={() => {
                  if (day) {
                    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12, 0, 0);
                    onChange(formatDateToISO(selected));
                    setIsOpen(false);
                  }
                }}
                className={`h-7 w-7 text-xs flex items-center justify-center rounded-lg transition-colors ${!day ? 'invisible' : 'hover:bg-theme/20 dark:hover:bg-theme/10 text-slate-600 dark:text-dark-app-text-secondary'} ${day && formatDateToISO(new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12, 0, 0)) === value ? 'bg-theme text-white font-bold' : ''}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<Props> = ({ transactions, baseSalary, currencySymbol }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateToISO(d);
  });
  const [endDate, setEndDate] = useState(() => formatDateToISO(new Date()));

  const periodData = useMemo(() => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    
    const filtered = transactions.filter(t => {
      const d = parseLocalDate(t.date);
      return d >= start && d <= end;
    });

    const income = filtered.filter(t => getTransactionEntryType(t) === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filtered.filter(t => getTransactionEntryType(t) === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const reserved = filtered.filter(t => getTransactionEntryType(t) === 'SAVINGS').reduce((acc, t) => acc + t.amount, 0);
    const reservePercentage = income > 0 ? (reserved / income) * 100 : 0;

    return { income, expenses, reserved, reservePercentage };
  }, [transactions, startDate, endDate]);

  const chartData = useMemo(() => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const range: string[] = [];
    let runningBalance = transactions.filter(t => parseLocalDate(t.date) < start).reduce((acc, t) => getTransactionEntryType(t) === 'INCOME' ? acc + t.amount : acc - t.amount, 0);
    const curr = new Date(start);
    while (curr <= end) {
      range.push(formatDateToISO(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return range.map(dateStr => {
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      const dayNet = dayTransactions.reduce((acc, t) => getTransactionEntryType(t) === 'INCOME' ? acc + t.amount : acc - t.amount, 0);
      runningBalance += dayNet;
      const d = parseLocalDate(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      return { date: dateStr, day, month: MONTH_NAMES[d.getMonth()], saldo: runningBalance };
    });
  }, [transactions, startDate, endDate]);

  const pieData = useMemo(() => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const categoriesMap: Record<string, number> = {};
    transactions
      .filter(t => {
        const d = parseLocalDate(t.date);
        return getTransactionEntryType(t) === 'EXPENSE' && d >= start && d <= end;
      })
      .forEach(t => { 
        categoriesMap[t.entryType] = (categoriesMap[t.entryType] || 0) + t.amount; 
      });
    return Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));
  }, [transactions, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-app-surface p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-app-border transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-dark-app-text-secondary text-sm font-medium">Ganhos</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-lg"><TrendingUp size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">{currencySymbol} {periodData.income.toLocaleString('pt-BR')}</p>
          <div className="mt-2 text-xs text-slate-400 dark:text-dark-app-text-secondary">Acumulado no período</div>
        </div>
        <div className="bg-white dark:bg-dark-app-surface p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-app-border transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-dark-app-text-secondary text-sm font-medium">Despesas</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 rounded-lg"><TrendingDown size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">{currencySymbol} {periodData.expenses.toLocaleString('pt-BR')}</p>
          <div className="mt-2 text-xs text-slate-400 dark:text-dark-app-text-secondary">Saídas no período</div>
        </div>
        <div className="bg-white dark:bg-dark-app-surface p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-app-border transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-dark-app-text-secondary text-sm font-medium">Reservado</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-lg"><Landmark size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">{currencySymbol} {periodData.reserved.toLocaleString('pt-BR')}</p>
          <div className="mt-2 text-xs text-slate-400 dark:text-dark-app-text-secondary">Destinado à reserva no período</div>
        </div>
        <div className="bg-white dark:bg-dark-app-surface p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-app-border transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-dark-app-text-secondary text-sm font-medium">% de Reserva</span>
            <div className="p-2 bg-theme/20 text-theme rounded-lg"><Percent size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">{periodData.reservePercentage.toFixed(1)}%</p>
          <div className="mt-2 w-full bg-slate-100 dark:bg-dark-app-surface-secondary rounded-full h-1.5">
            <div className="bg-theme h-1.5 rounded-full" style={{ width: `${Math.min(periodData.reservePercentage, 100)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dark-app-surface p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-app-border flex flex-col transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-dark-app-text-primary">Movimentações</h3>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-dark-app-surface-secondary p-3 rounded-xl border border-slate-100 dark:border-dark-app-border transition-colors">
              <CustomDatePicker label="Início" value={startDate} onChange={setStartDate} />
              <div className="h-8 w-px bg-slate-200 dark:bg-dark-app-surface-secondary self-end mb-1"></div>
              <CustomDatePicker label="Fim" value={endDate} onChange={setEndDate} />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ bottom: 30 }}>
                <defs><linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#35b784" stopOpacity={0.4}/><stop offset="95%" stopColor="#35b784" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-dark-app-text-secondary" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}} interval={chartData.length > 31 ? Math.floor(chartData.length / 15) : 1} height={30} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} interval={0} tick={(props) => { const { x, y, payload, index } = props; const isFirst = index === 0 || chartData[index]?.month !== chartData[index - 1]?.month; if (!isFirst) return null; return ( <text x={x} y={Number(y ?? 0) + 25} fill="currentColor" className="text-slate-600 dark:text-dark-app-text-secondary" fontSize={11} fontWeight={700} textAnchor="start">{payload.value}</text> ); }} xAxisId="monthAxis" padding={{ left: 10, right: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => { const numeric = Number(val ?? 0); return `${currencySymbol} ${numeric >= 1000 ? (numeric / 1000).toFixed(0) + 'k' : numeric}`; }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: '#fff', color: '#1e293b' }} itemStyle={{ color: '#35b784' }} formatter={(value) => { const numeric = Number(value ?? 0); return [`${currencySymbol} ${numeric.toLocaleString('pt-BR')}`, 'Saldo']; }} labelFormatter={(label, payload) => { if (payload && payload.length > 0) { const item = payload[0].payload; return `${item.day} de ${item.month}`; } return label; }} labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#1e293b' }} />
                <Area type="monotone" dataKey="saldo" stroke="#35b784" strokeWidth={4} fillOpacity={1} fill="url(#colorSaldo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-app-surface p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-app-border transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-dark-app-text-primary mb-6">Gastos por Categoria</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#cbd5e1'} /> ))}
                </Pie>
                <Tooltip formatter={(value) => `${currencySymbol} ${Number(value ?? 0).toLocaleString('pt-BR')}`} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#1e293b' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
