// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MonthlyTransactionsView from './MonthlyTransactionsView';
import { Transaction } from '../types';

afterEach(cleanup);

const defaultDateRange = { start: '2026-08-01', end: '2026-08-31' };

const sampleTransactions: Transaction[] = [
  {
    id: 't1',
    description: 'Salário de Agosto',
    amount: 5000,
    entryType: 'INCOME',
    date: '2026-08-05',
    comment: '',
    tags: ['trabalho'],
  },
  {
    id: 't2',
    description: 'Supermercado de Agosto',
    amount: 600,
    entryType: 'EXPENSE',
    date: '2026-08-10',
    comment: '',
    tags: ['alimentacao'],
  },
  {
    id: 't3',
    description: 'Restaurante de Agosto',
    amount: 150,
    entryType: 'EXPENSE',
    date: '2026-08-15',
    comment: '',
    tags: ['alimentacao'],
  },
  {
    id: 't4',
    description: 'Compra em Setembro',
    amount: 200,
    entryType: 'EXPENSE',
    date: '2026-09-10',
    comment: '',
    tags: ['trabalho'], // 'alimentacao' does not exist in Sept!
  },
];

describe('MonthlyTransactionsView', () => {
  it('filters by initialTag upon rendering', () => {
    render(
      <MonthlyTransactionsView
        transactions={sampleTransactions}
        dateRange={defaultDateRange}
        setDateRange={vi.fn()}
        cards={[]}
        currencySymbol="R$"
        initialType="ALL"
        initialTag="alimentacao"
        onBack={vi.fn()}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    // Only t2 and t3 should be displayed
    expect(screen.getByText('Supermercado de Agosto')).toBeDefined();
    expect(screen.getByText('Restaurante de Agosto')).toBeDefined();
    expect(screen.queryByText('Salário de Agosto')).toBeNull();

    // Tag filter combobox should have 'alimentacao' selected
    const tagFilterSelect = screen.getByRole('combobox', { name: 'Filtrar por tag' });
    expect((tagFilterSelect as HTMLSelectElement).value).toBe('alimentacao');
  });

  it('allows changing the tag filter and removing it', () => {
    render(
      <MonthlyTransactionsView
        transactions={sampleTransactions}
        dateRange={defaultDateRange}
        setDateRange={vi.fn()}
        cards={[]}
        currencySymbol="R$"
        initialType="ALL"
        initialTag="alimentacao"
        onBack={vi.fn()}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const tagFilterSelect = screen.getByRole('combobox', { name: 'Filtrar por tag' });

    // Switch to 'Todas as tags'
    fireEvent.change(tagFilterSelect, { target: { value: '' } });
    expect(screen.getByText('Salário de Agosto')).toBeDefined();
    expect(screen.getByText('Supermercado de Agosto')).toBeDefined();
    expect(screen.getByText('Restaurante de Agosto')).toBeDefined();

    // Switch to 'trabalho'
    fireEvent.change(tagFilterSelect, { target: { value: 'trabalho' } });
    expect(screen.getByText('Salário de Agosto')).toBeDefined();
    expect(screen.queryByText('Supermercado de Agosto')).toBeNull();
  });

  it('resets tagFilter when moving to a month where the tag does not exist', () => {
    let currentRange = { ...defaultDateRange };
    const setDateRange = vi.fn((newRange) => {
      currentRange = newRange;
    });

    const { rerender } = render(
      <MonthlyTransactionsView
        transactions={sampleTransactions}
        dateRange={currentRange}
        setDateRange={setDateRange}
        cards={[]}
        currencySymbol="R$"
        initialType="ALL"
        initialTag="alimentacao"
        onBack={vi.fn()}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    // Advance to next month (September)
    const nextMonthBtn = screen.getByRole('button', { name: 'Próximo mês' });
    fireEvent.click(nextMonthBtn);

    expect(setDateRange).toHaveBeenCalledWith({ start: '2026-09-01', end: '2026-09-30' });

    // Rerender with the new dateRange
    rerender(
      <MonthlyTransactionsView
        transactions={sampleTransactions}
        dateRange={{ start: '2026-09-01', end: '2026-09-30' }}
        setDateRange={setDateRange}
        cards={[]}
        currencySymbol="R$"
        initialType="ALL"
        onBack={vi.fn()}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    // In September, 'alimentacao' does not exist, so tagFilter should have been reset to ''
    // Showing 'Compra em Setembro'
    expect(screen.getByText('Compra em Setembro')).toBeDefined();
  });
});
