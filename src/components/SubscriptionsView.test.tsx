// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SubscriptionsView from './SubscriptionsView';
import { CreditCard, SalaryInfo, Subscription } from '../types';

afterEach(cleanup);

const mockCards: CreditCard[] = [
  {
    id: 'card-1',
    name: 'Nubank Roxinho',
    bank: 'Nubank',
    type: 'CREDIT',
    isActive: true,
    dueDay: 10,
    closingDay: 3
  }
];

const mockSalaryInfo: SalaryInfo = {
  gross: 5000,
  discounts: []
};

const initialSubs: Subscription[] = [
  {
    id: 'sub-1',
    name: 'Spotify',
    amount: 21.9,
    dueDay: 20,
    cycle: 'MONTHLY',
    paymentType: 'DIRECT_DEBIT',
    status: 'ACTIVE',
    isActive: true
  },
  {
    id: 'sub-2',
    name: 'Netflix',
    amount: 55.9,
    dueDay: 10,
    cycle: 'MONTHLY',
    paymentType: 'CREDIT_CARD',
    cardId: 'card-1',
    status: 'ACTIVE',
    isActive: true
  }
];

describe('SubscriptionsView Component', () => {
  it('renders top metric cards correctly', () => {
    render(
      <SubscriptionsView
        subscriptions={initialSubs}
        setSubscriptions={vi.fn()}
        cards={mockCards}
        salaryInfo={mockSalaryInfo}
        baseSalary={5000}
        currencySymbol="R$"
      />
    );

    // Header metrics
    expect(screen.getByText('Total Mensal')).toBeDefined();
    expect(screen.getByText('Custo Anual')).toBeDefined();
    expect(screen.getByText('% da Renda Líquida')).toBeDefined();

    // 21.9 + 55.9 = 77.8
    expect(screen.getByText('R$ 77,80')).toBeDefined();
    // 77.8 * 12 = 933.6
    expect(screen.getByText('R$ 933,60')).toBeDefined();
    // 77.8 / 5000 = 1.6%
    expect(screen.getByText('1.6%')).toBeDefined();
  });

  it('renders list sorted by dueDay ascending', () => {
    render(
      <SubscriptionsView
        subscriptions={initialSubs}
        setSubscriptions={vi.fn()}
        cards={mockCards}
        currencySymbol="R$"
      />
    );

    // Netflix is due on 10, Spotify on 20
    const subNames = screen.getAllByRole('strong').map(el => el.textContent);
    expect(subNames[0]).toBe('Netflix');
    expect(subNames[1]).toBe('Spotify');
  });

  it('opens creation modal, shows autocomplete suggestions, and creates subscription', () => {
    const TestWrapper = () => {
      const [subs, setSubs] = useState<Subscription[]>(initialSubs);
      return (
        <SubscriptionsView
          subscriptions={subs}
          setSubscriptions={setSubs}
          cards={mockCards}
          currencySymbol="R$"
        />
      );
    };

    render(<TestWrapper />);

    // Click "Nova Assinatura"
    const newBtn = screen.getByRole('button', { name: /Nova Assinatura/i });
    fireEvent.click(newBtn);

    expect(screen.getByRole('heading', { name: 'Nova Assinatura' })).toBeDefined();

    // Type in service name to test autocomplete
    const nameInput = screen.getByPlaceholderText(/Ex: Netflix, Spotify, ChatGPT/i);
    fireEvent.change(nameInput, { target: { value: 'chat' } });

    // Suggestion for ChatGPT Plus should appear
    const suggestionBtn = screen.getByText('ChatGPT Plus');
    expect(suggestionBtn).toBeDefined();
    fireEvent.click(suggestionBtn);

    // Name input should now be "ChatGPT Plus"
    expect((nameInput as HTMLInputElement).value).toBe('ChatGPT Plus');

    // Fill amount
    const amountInput = screen.getByPlaceholderText('0,00');
    fireEvent.change(amountInput, { target: { value: '100' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Criar Assinatura' });
    fireEvent.click(submitBtn);

    // Should now be in the list
    expect(screen.getByText('ChatGPT Plus')).toBeDefined();
  });

  it.each([
    { query: 'net', service: 'Netflix', dueDay: '10' },
    { query: 'spo', service: 'Spotify', dueDay: '5' }
  ])('autocompletes $service with catalog defaults', ({ query, service, dueDay }) => {
    render(<SubscriptionsView subscriptions={[]} setSubscriptions={vi.fn()} cards={mockCards} />);
    fireEvent.click(screen.getByRole('button', { name: /Nova Assinatura/i }));

    const nameInput = screen.getByPlaceholderText(/Ex: Netflix, Spotify, ChatGPT/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: query } });
    fireEvent.click(screen.getByText(service));

    expect(nameInput.value).toBe(service);
    const dueDayLabel = screen.getByText(/Dia do Vencimento/i);
    expect((dueDayLabel.parentElement?.querySelector('input') as HTMLInputElement).value).toBe(dueDay);
  });

  it('switches between direct debit and credit card payment options', () => {
    render(<SubscriptionsView subscriptions={[]} setSubscriptions={vi.fn()} cards={mockCards} />);
    fireEvent.click(screen.getByRole('button', { name: /Nova Assinatura/i }));

    expect(screen.queryByText('Nubank Roxinho')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cartão de Crédito' }));
    expect(screen.getByText('Nubank Roxinho')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Saída Direta' }));
    expect(screen.queryByText('Nubank Roxinho')).toBeNull();
  });

  it('allows pausing a subscription and viewing it in inactive section', () => {
    const TestWrapper = () => {
      const [subs, setSubs] = useState<Subscription[]>(initialSubs);
      return (
        <SubscriptionsView
          subscriptions={subs}
          setSubscriptions={setSubs}
          cards={mockCards}
          currencySymbol="R$"
        />
      );
    };

    render(<TestWrapper />);

    // Click pause on Netflix (first item)
    const pauseButtons = screen.getAllByTitle('Pausar assinatura');
    fireEvent.click(pauseButtons[0]);

    // Section for inactive items should appear
    expect(screen.getByText(/Assinaturas Pausadas \/ Inativas/i)).toBeDefined();
  });

  it('allows deleting a subscription after confirmation', () => {
    const TestWrapper = () => {
      const [subs, setSubs] = useState<Subscription[]>(initialSubs);
      return (
        <SubscriptionsView
          subscriptions={subs}
          setSubscriptions={setSubs}
          cards={mockCards}
          currencySymbol="R$"
        />
      );
    };

    render(<TestWrapper />);

    // Click delete on Netflix
    const deleteButtons = screen.getAllByTitle('Excluir assinatura');
    fireEvent.click(deleteButtons[0]);

    // Delete confirmation modal should open
    expect(screen.getByRole('heading', { name: 'Excluir Assinatura?' })).toBeDefined();

    // Confirm deletion
    const confirmDeleteBtn = screen.getByRole('button', { name: 'Excluir' });
    fireEvent.click(confirmDeleteBtn);

    // Netflix should no longer be rendered
    expect(screen.queryByText('Netflix')).toBeNull();
  });
});
