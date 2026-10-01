// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TotalsView from './TotalsView';
import DayTransactionsView from './DayTransactionsView';
import MonthlyTransactionsView from './MonthlyTransactionsView';
import SavedAnnualView from './SavedAnnualView';

describe('Swipe Navigation across views', () => {
  describe('TotalsView swipe', () => {
    it('swipes left to go to next month', () => {
      const setDateRange = vi.fn();
      const { container } = render(
        <TotalsView
          transactions={[]}
          dateRange={{ start: '2026-05-01', end: '2026-05-31' }}
          setDateRange={setDateRange}
          cards={[]}
          currencySymbol="R$"
          savingsTarget={20}
          onOpenHorizon={vi.fn()}
          onOpenSavedAnnual={vi.fn()}
          onOpenMonthlyTransactions={vi.fn()}
        />
      );

      const section = container.querySelector('section')!;
      fireEvent.touchStart(section, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchEnd(section, { changedTouches: [{ clientX: 100, clientY: 100 }] });

      expect(setDateRange).toHaveBeenCalledTimes(1);
      expect(setDateRange).toHaveBeenCalledWith({ start: '2026-06-01', end: '2026-06-30' });
    });

    it('swipes right to go to previous month', () => {
      const setDateRange = vi.fn();
      const { container } = render(
        <TotalsView
          transactions={[]}
          dateRange={{ start: '2026-05-01', end: '2026-05-31' }}
          setDateRange={setDateRange}
          cards={[]}
          currencySymbol="R$"
          savingsTarget={20}
          onOpenHorizon={vi.fn()}
          onOpenSavedAnnual={vi.fn()}
          onOpenMonthlyTransactions={vi.fn()}
        />
      );

      const section = container.querySelector('section')!;
      fireEvent.touchStart(section, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(section, { changedTouches: [{ clientX: 200, clientY: 100 }] });

      expect(setDateRange).toHaveBeenCalledTimes(1);
      expect(setDateRange).toHaveBeenCalledWith({ start: '2026-04-01', end: '2026-04-30' });
    });

    it('does not trigger month change on vertical swipe', () => {
      const setDateRange = vi.fn();
      const { container } = render(
        <TotalsView
          transactions={[]}
          dateRange={{ start: '2026-05-01', end: '2026-05-31' }}
          setDateRange={setDateRange}
          cards={[]}
          currencySymbol="R$"
          savingsTarget={20}
          onOpenHorizon={vi.fn()}
          onOpenSavedAnnual={vi.fn()}
          onOpenMonthlyTransactions={vi.fn()}
        />
      );

      const section = container.querySelector('section')!;
      fireEvent.touchStart(section, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(section, { changedTouches: [{ clientX: 110, clientY: 250 }] });

      expect(setDateRange).not.toHaveBeenCalled();
    });
  });

  describe('DayTransactionsView swipe', () => {
    it('swipes left to advance to next day and right to go to previous day', () => {
      const { container, getByText } = render(
        <DayTransactionsView
          date="2026-05-15"
          transactions={[]}
          cards={[]}
          currencySymbol="R$"
          onBack={vi.fn()}
          onAdd={vi.fn()}
          onEdit={vi.fn()}
        />
      );

      expect(getByText('15/05')).toBeDefined();

      const section = container.querySelector('section')!;
      // Swipe left -> next day (16/05)
      fireEvent.touchStart(section, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchEnd(section, { changedTouches: [{ clientX: 100, clientY: 100 }] });
      expect(getByText('16/05')).toBeDefined();

      // Swipe right -> previous day (back to 15/05)
      fireEvent.touchStart(section, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(section, { changedTouches: [{ clientX: 200, clientY: 100 }] });
      expect(getByText('15/05')).toBeDefined();
    });
  });

  describe('MonthlyTransactionsView swipe', () => {
    it('swipes left to go to next month and right to previous month', () => {
      const setDateRange = vi.fn();
      const { container } = render(
        <MonthlyTransactionsView
          transactions={[]}
          dateRange={{ start: '2026-05-01', end: '2026-05-31' }}
          setDateRange={setDateRange}
          cards={[]}
          currencySymbol="R$"
          initialType="EXPENSE"
          onBack={vi.fn()}
          onAdd={vi.fn()}
          onEdit={vi.fn()}
        />
      );

      const section = container.querySelector('section')!;
      // Swipe left -> June
      fireEvent.touchStart(section, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchEnd(section, { changedTouches: [{ clientX: 100, clientY: 100 }] });
      expect(setDateRange).toHaveBeenCalledWith({ start: '2026-06-01', end: '2026-06-30' });

      // Swipe right -> April
      fireEvent.touchStart(section, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(section, { changedTouches: [{ clientX: 200, clientY: 100 }] });
      expect(setDateRange).toHaveBeenCalledWith({ start: '2026-04-01', end: '2026-04-30' });
    });
  });

  describe('SavedAnnualView swipe', () => {
    it('swipes left to go to next year and right to previous year', () => {
      const { container, getByText } = render(
        <SavedAnnualView
          transactions={[]}
          cards={[]}
          currencySymbol="R$"
          initialYear={2026}
          onBack={vi.fn()}
        />
      );

      expect(getByText('2026')).toBeDefined();

      const section = container.querySelector('section')!;
      // Swipe left -> next year (2027)
      fireEvent.touchStart(section, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchEnd(section, { changedTouches: [{ clientX: 100, clientY: 100 }] });
      expect(getByText('2027')).toBeDefined();

      // Swipe right -> previous year (back to 2026)
      fireEvent.touchStart(section, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(section, { changedTouches: [{ clientX: 200, clientY: 100 }] });
      expect(getByText('2026')).toBeDefined();
    });
  });
});
