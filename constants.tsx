
import { Category } from './types';

// Define the color scheme for each transaction category.
export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.SALARY]: '#10b981', // Emerald 500
  [Category.RESERVE]: '#3b82f6', // Blue 500
  [Category.FOOD]: '#f59e0b', // Amber 500
  [Category.TRANSPORT]: '#6366f1', // Indigo 500
  [Category.HEALTH]: '#ef4444', // Red 500
  [Category.LEISURE]: '#ec4899', // Pink 500
  [Category.HOUSE]: '#8b5cf6', // Violet 500
  [Category.SUBSCRIPTION]: '#06b6d4', // Cyan 500
  // Fix: Added missing property [Category.ADJUSTMENT] to satisfy the Record<Category, string> type.
  [Category.ADJUSTMENT]: '#64748b', // Slate 500
  [Category.OTHER]: '#94a3b8', // Slate 400
};