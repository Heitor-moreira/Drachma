// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TotalsView from './TotalsView';
import { Transaction } from '../types';

afterEach(cleanup);

const defaultDateRange = { start: '2026-08-01', end: '2026-08-31' };

const sampleTransactions: Transaction[] = [
  {
    id: 't1',
    description: 'Salário',
    amount: 5000,
    entryType: 'INCOME',
    date: '2026-08-05',
    comment: '',
    tags: ['trabalho'],
  },
  {
    id: 't2',
    description: 'Supermercado',
    amount: 600,
    entryType: 'EXPENSE',
    date: '2026-08-10',
    comment: '',
    tags: ['alimentacao'],
  },
  {
    id: 't3',
    description: 'Restaurante',
    amount: 150,
    entryType: 'EXPENSE',
    date: '2026-08-15',
    comment: '',
    tags: ['alimentacao'],
  },
  {
    id: 't4',
    description: 'Cinema',
    amount: 80,
    entryType: 'EXPENSE',
    date: '2026-08-20',
    comment: '',
    tags: ['lazer'],
  },
];

describe('TotalsView', () => {
  it('renders performance verdict in a dedicated block below the icons without colliding', () => {
    const { container } = render(
      <TotalsView
        transactions={sampleTransactions}
        dateRange={defaultDateRange}
        setDateRange={vi.fn()}
        cards={[]}
        currencySymbol="R$"
        savingsTarget={20}
        onOpenHorizon={vi.fn()}
        onOpenSavedAnnual={vi.fn()}
        onOpenMonthlyTransactions={vi.fn()}
        onOpenTaggedMonthlyTransactions={vi.fn()}
      />
    );

    const performanceHeading = screen.getByRole('heading', { level: 3, name: 'Performance' });
    expect(performanceHeading).toBeDefined();

    // Check that monetary value is rendered
    expect(screen.getByText('R$ 4.170,00')).toBeDefined();

    // Check that performance verdict text is rendered with break-words in its dedicated paragraph
    const verdictParagraph = container.querySelector('p.break-words');
    expect(verdictParagraph).not.toBeNull();
    expect(verdictParagraph?.textContent?.length).toBeGreaterThan(0);
    expect(verdictParagraph?.className).toContain('mt-2');
    expect(verdictParagraph?.className).toContain('text-sm');
  });

  it('renders tags of the month as accessible interactive buttons and calls onOpenTaggedMonthlyTransactions', () => {
    const onOpenTaggedMonthlyTransactions = vi.fn();
    render(
      <TotalsView
        transactions={sampleTransactions}
        dateRange={defaultDateRange}
        setDateRange={vi.fn()}
        cards={[]}
        currencySymbol="R$"
        savingsTarget={20}
        onOpenHorizon={vi.fn()}
        onOpenSavedAnnual={vi.fn()}
        onOpenMonthlyTransactions={vi.fn()}
        onOpenTaggedMonthlyTransactions={onOpenTaggedMonthlyTransactions}
      />
    );

    const alimentacaoBtn = screen.getByRole('button', { name: 'Ver lançamentos da tag #alimentacao' });
    expect(alimentacaoBtn).toBeDefined();

    fireEvent.click(alimentacaoBtn);
    expect(onOpenTaggedMonthlyTransactions).toHaveBeenCalledTimes(1);
    expect(onOpenTaggedMonthlyTransactions).toHaveBeenCalledWith('alimentacao');
  });

  it('allows sorting tags alphabetically and by value with direction toggle', () => {
    render(
      <TotalsView
        transactions={sampleTransactions}
        dateRange={defaultDateRange}
        setDateRange={vi.fn()}
        cards={[]}
        currencySymbol="R$"
        savingsTarget={20}
        onOpenHorizon={vi.fn()}
        onOpenSavedAnnual={vi.fn()}
        onOpenMonthlyTransactions={vi.fn()}
        onOpenTaggedMonthlyTransactions={vi.fn()}
      />
    );

    // Default: alpha asc -> alimentacao (-750), lazer (-80), trabalho (+5000)
    let tagButtons = screen.getAllByRole('button', { name: /Ver lançamentos da tag/ });
    expect(tagButtons.map(b => b.textContent)).toEqual([
      expect.stringContaining('#alimentacao'),
      expect.stringContaining('#lazer'),
      expect.stringContaining('#trabalho'),
    ]);

    // Toggle direction to desc (Z-A)
    const toggleDirBtn = screen.getByRole('button', { name: 'Alternar para ordem decrescente' });
    fireEvent.click(toggleDirBtn);

    tagButtons = screen.getAllByRole('button', { name: /Ver lançamentos da tag/ });
    expect(tagButtons.map(b => b.textContent)).toEqual([
      expect.stringContaining('#trabalho'),
      expect.stringContaining('#lazer'),
      expect.stringContaining('#alimentacao'),
    ]);

    // Switch to 'value' sorting (default for value is desc: highest positive first)
    const sortSelect = screen.getByRole('combobox', { name: 'Critério de ordenação das tags' });
    fireEvent.change(sortSelect, { target: { value: 'value' } });

    tagButtons = screen.getAllByRole('button', { name: /Ver lançamentos da tag/ });
    // desc: trabalho (+5000), lazer (-80), alimentacao (-750)
    expect(tagButtons.map(b => b.textContent)).toEqual([
      expect.stringContaining('#trabalho'),
      expect.stringContaining('#lazer'),
      expect.stringContaining('#alimentacao'),
    ]);

    // Toggle direction to asc: most negative first (-750, -80, +5000)
    const toggleToAscBtn = screen.getByRole('button', { name: 'Alternar para ordem crescente' });
    fireEvent.click(toggleToAscBtn);

    tagButtons = screen.getAllByRole('button', { name: /Ver lançamentos da tag/ });
    expect(tagButtons.map(b => b.textContent)).toEqual([
      expect.stringContaining('#alimentacao'),
      expect.stringContaining('#lazer'),
      expect.stringContaining('#trabalho'),
    ]);
  });
});
