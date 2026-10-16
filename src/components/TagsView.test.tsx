// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TagsView, { TotalFilteredCard } from './TagsView';
import { Transaction } from '../types';

afterEach(cleanup);

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
const currentDate = `${currentYear}-${currentMonth}-10`;

const sampleTransactions: Transaction[] = [
  {
    id: 't-inc',
    description: 'Salário',
    amount: 3000,
    entryType: 'INCOME',
    date: currentDate,
    tags: ['renda'],
    comment: '',
  },
  {
    id: 't-exp',
    description: 'Mercado',
    amount: 500,
    entryType: 'EXPENSE',
    date: currentDate,
    tags: ['alimentacao'],
    comment: '',
  },
  {
    id: 't-card',
    description: 'Restaurante Cartão',
    amount: 200,
    entryType: 'CARD',
    date: currentDate,
    tags: ['alimentacao'],
    comment: '',
  },
  {
    id: 't-sav',
    description: 'Aporte CDB',
    amount: 400,
    entryType: 'SAVINGS',
    date: currentDate,
    tags: ['reserva'],
    comment: '',
  },
];

describe('TagsView', () => {
  it('renders card with ALL filter showing income, total expenses, and savings', () => {
    render(
      <TagsView
        transactions={sampleTransactions}
        cards={[]}
        currencySymbol="R$"
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const card = screen.getByTestId('total-filtered-card');
    expect(card).toBeDefined();

    // In ALL: Entradas (+ R$ 3.000,00) and Saídas (- R$ 700,00, expense 500 + card 200)
    expect(card.textContent).toContain('Entradas:');
    expect(card.textContent).toContain('+ R$ 3.000,00');
    expect(card.textContent).toContain('Saídas:');
    expect(card.textContent).toContain('- R$ 700,00');
    expect(card.textContent).toContain('Economias:');
    expect(card.textContent).toContain('R$ 400,00');
  });

  it('renders card with INCOME filter showing only Total de Entradas', () => {
    render(
      <TagsView
        transactions={sampleTransactions}
        cards={[]}
        currencySymbol="R$"
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const typeFilterSelect = screen.getByRole('combobox', { name: /filtrar por tipo/i });
    fireEvent.change(typeFilterSelect, { target: { value: 'INCOME' } });

    const card = screen.getByTestId('total-filtered-card');
    expect(card.textContent).toContain('Total de Entradas');
    expect(card.textContent).toContain('+ R$ 3.000,00');
    expect(card.textContent).not.toContain('Total de Saídas');
  });

  it('renders card with EXPENSE filter showing only Total de Saídas', () => {
    render(
      <TagsView
        transactions={sampleTransactions}
        cards={[]}
        currencySymbol="R$"
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const typeFilterSelect = screen.getByRole('combobox', { name: /filtrar por tipo/i });
    fireEvent.change(typeFilterSelect, { target: { value: 'EXPENSE' } });

    const card = screen.getByTestId('total-filtered-card');
    expect(card.textContent).toContain('Total de Saídas');
    expect(card.textContent).toContain('- R$ 500,00');
    expect(card.textContent).not.toContain('Total de Entradas');
  });

  it('renders empty state showing R$ 0,00 instead of hiding the card', () => {
    render(
      <TagsView
        transactions={[]}
        cards={[]}
        currencySymbol="R$"
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const card = screen.getByTestId('total-filtered-card');
    expect(card).toBeDefined();
    expect(card.textContent).toContain('+ R$ 0,00');
    expect(card.textContent).toContain('- R$ 0,00');

    // Switch to INCOME with empty list
    const typeFilterSelect = screen.getByRole('combobox', { name: /filtrar por tipo/i });
    fireEvent.change(typeFilterSelect, { target: { value: 'INCOME' } });

    expect(card.textContent).toContain('Total de Entradas');
    expect(card.textContent).toContain('+ R$ 0,00');

    // Switch to EXPENSE with empty list
    fireEvent.change(typeFilterSelect, { target: { value: 'EXPENSE' } });
    expect(card.textContent).toContain('Total de Saídas');
    expect(card.textContent).toContain('- R$ 0,00');
  });
});

describe('TotalFilteredCard standalone', () => {
  it('correctly handles specific CARD and SAVINGS types', () => {
    const totals = {
      income: 0,
      expense: 0,
      card: 350.5,
      savings: 120.75,
      totalExpenses: 350.5,
    };

    const { rerender } = render(
      <TotalFilteredCard type="CARD" currencySymbol="R$" totals={totals} />
    );
    expect(screen.getByText('Total em Cartão')).toBeDefined();
    expect(screen.getByText('- R$ 350,50')).toBeDefined();

    rerender(<TotalFilteredCard type="SAVINGS" currencySymbol="R$" totals={totals} />);
    expect(screen.getByText('Total em Economias')).toBeDefined();
    expect(screen.getByText('+ R$ 120,75')).toBeDefined();
  });
});
