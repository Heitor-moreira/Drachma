import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Props extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  className?: string;
  icon?: React.ReactNode;
}

export const FilterDotsIcon = () => <span aria-hidden="true" className="grid h-5 w-5 shrink-0 grid-cols-2 grid-rows-2 gap-1"><span className="rounded-full bg-slate-500 dark:bg-dark-app-text-secondary" /><span className="rounded-full bg-slate-500 dark:bg-dark-app-text-secondary" /><span className="rounded-full bg-slate-500 dark:bg-dark-app-text-secondary" /><span className="rounded-full bg-slate-500 dark:bg-dark-app-text-secondary" /></span>;

const FilterPill: React.FC<Props> = ({ className = '', icon, children, ...selectProps }) => <div className={`relative flex h-11 min-w-0 w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 shadow-sm dark:border-dark-app-border dark:bg-dark-app-surface ${className}`}><span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-500 dark:text-dark-app-text-secondary">{icon || <FilterDotsIcon />}</span><select {...selectProps} className="min-w-0 w-full appearance-none bg-transparent pr-6 text-base font-medium text-slate-700 outline-none dark:text-dark-app-text-primary dark:[color-scheme:dark]">{children}</select><ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500 dark:text-dark-app-text-secondary" /></div>;

export default FilterPill;
