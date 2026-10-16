// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RecentTransactionsView from './RecentTransactionsView';
import { Transaction } from '../types';

afterEach(cleanup);

const sampleTransactions: Transaction[] = [
  {
    id: 'tx-1',
    description: 'Transação Data Futura Criada Primeiro',
    amount: 150,
    entryType: 'EXPENSE',
    date: '2026-08-28',
    createdAt: '2026-08-01T10:00:00.000Z',
    comment: '',
  },
  {
    id: 'tx-2',
    description: 'Transação Data Antiga Criada Depois',
    amount: 250,
    entryType: 'INCOME',
    date: '2026-08-05',
    createdAt: '2026-08-20T10:00:00.000Z',
    comment: '',
  },
];

describe('RecentTransactionsView', () => {
  it('renders date criteria selector with options and defaults to CREATION_DATE', () => {
    render(
      <RecentTransactionsView
        transactions={sampleTransactions}
        cards={[]}
        currencySymbol="R$"
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const dateCriteriaSelect = screen.getByRole('combobox', { name: /critério de data/i }) as HTMLSelectElement;
    expect(dateCriteriaSelect).toBeDefined();
    expect(dateCriteriaSelect.value).toBe('CREATION_DATE');

    const options = Array.from(dateCriteriaSelect.options).map(opt => opt.text);
    expect(options).toContain('Data de criação');
    expect(options).toContain('Data do lançamento');
  });

  it('orders transactions by creation date by default and updates when switching to transaction date', () => {
    render(
      <RecentTransactionsView
        transactions={sampleTransactions}
        cards={[]}
        currencySymbol="R$"
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    // Default: CREATION_DATE DESC -> tx-2 (Aug 20 created) then tx-1 (Aug 01 created)
    let descriptions = screen.getAllByRole('strong').map(el => el.textContent).filter(t => t?.startsWith('Transação'));
    expect(descriptions).toEqual([
      'Transação Data Antiga Criada Depois',
      'Transação Data Futura Criada Primeiro',
    ]);

    // Switch to TRANSACTION_DATE
    const dateCriteriaSelect = screen.getByRole('combobox', { name: /critério de data/i });
    fireEvent.change(dateCriteriaSelect, { target: { value: 'TRANSACTION_DATE' } });

    // Now: TRANSACTION_DATE DESC -> tx-1 (Aug 28 date) then tx-2 (Aug 05 date)
    descriptions = screen.getAllByRole('strong').map(el => el.textContent).filter(t => t?.startsWith('Transação'));
    expect(descriptions).toEqual([
      'Transação Data Futura Criada Primeiro',
      'Transação Data Antiga Criada Depois',
    ]);

    // Toggle to ASC order
    const sortBtn = screen.getByRole('button', { name: /ordenação/i });
    fireEvent.click(sortBtn);

    // Now: TRANSACTION_DATE ASC -> tx-2 (Aug 05 date) then tx-1 (Aug 28 date)
    descriptions = screen.getAllByRole('strong').map(el => el.textContent).filter(t => t?.startsWith('Transação'));
    expect(descriptions).toEqual([
      'Transação Data Antiga Criada Depois',
      'Transação Data Futura Criada Primeiro',
    ]);
  });
});
