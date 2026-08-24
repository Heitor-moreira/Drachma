import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TransactionForm from './components/TransactionForm';

describe('transaction form type markers', () => {
  it('uses C as the card marker in the new transaction modal', () => {
    const html = renderToStaticMarkup(React.createElement(TransactionForm, { onAdd: () => undefined, onClose: () => undefined, currencySymbol: 'R$', initialFinancialGroup: 'CARD' }));

    expect(html).toContain('>C</span>');
  });
});
