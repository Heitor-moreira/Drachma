// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { RecentTransactionRow } from './RecentTransactionsView';

describe('RecentTransactionRow', () => {
  const originalType = RecentTransactionRow.type;

  afterEach(() => {
    // Restore the original component type after each test
    RecentTransactionRow.type = originalType;
  });

  it('renders at most 2 times when irrelevant updates occur (React.memo)', () => {
    // Spy on the actual render function
    const renderSpy = vi.fn(originalType as any);
    RecentTransactionRow.type = renderSpy as any;
    
    const transaction: any = { 
      id: '1', 
      amount: 10, 
      entryType: 'INCOME', 
      date: '2023-01-01', 
      description: 'Test', 
      isInstallment: false 
    };

    const Wrapper = () => {
      const [count, setCount] = useState(0);
      
      const onEdit = React.useCallback(() => {}, []);
      return (
        <div>
          <button data-testid="btn" onClick={() => setCount(c => c + 1)}>Update {count}</button>
          <RecentTransactionRow
            transaction={transaction}
            currencySymbol="R$"
            onEdit={onEdit}
          />
        </div>
      );
    };

    const { getByTestId } = render(<Wrapper />);
    const button = getByTestId('btn');

    // Trigger state updates (irrelevant for the row)
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Initial render counts as 1. 
    // State updates in Wrapper should NOT re-render RecentTransactionRow
    // because of React.memo. Strict mode in vitest might cause 2 renders initially.
    expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
