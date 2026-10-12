import { SalaryInfo } from '../types';

export const getNetSalary = (salaryInfo?: SalaryInfo, baseSalary?: number): number => {
  if (salaryInfo && typeof salaryInfo.gross === 'number' && salaryInfo.gross > 0) {
    const totalDiscounts = (salaryInfo.discounts || []).reduce((acc, d) => {
      if (d.type === 'PERCENT') {
        return acc + (salaryInfo.gross * (d.amount / 100));
      }
      return acc + (d.amount || 0);
    }, 0);
    return Math.max(0, salaryInfo.gross - totalDiscounts);
  }
  return typeof baseSalary === 'number' && baseSalary > 0 ? baseSalary : 0;
};
