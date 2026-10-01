import { EntryType } from '../../types';
import { ParsedTransaction } from './ofxParser';

export interface CSVColumnMapping {
  dateCol: number;
  descriptionCol: number;
  amountCol: number;
}

export function parseCSV(csvContent: string, delimiter: string, mapping: CSVColumnMapping, hasHeader: boolean): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim() !== '');

  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    // Simple split for basic bank CSVs, ignoring delimiter inside quotes
    const regex = new RegExp(`(?!\s*$)\s*(?:'([^'\\\\]*(?:\\\\[\s\S][^'\\\\]*)*)'|"([^"\\\\]*(?:\\\\[\s\S][^"\\\\]*)*)"|([^${delimiter}"'\\\\]+))\s*(?:${delimiter}|$)`, "g");
    const cols: string[] = [];
    let match;
    const line = lines[i];
    
    // Fallback simple split if complex regex fails or for simplicity
    const simpleCols = line.split(delimiter).map(c => c.replace(/^"|"$/g, '').trim());

    if (simpleCols.length <= Math.max(mapping.dateCol, mapping.descriptionCol, mapping.amountCol)) continue;

    const rawDate = simpleCols[mapping.dateCol];
    const description = simpleCols[mapping.descriptionCol];

    let rawAmt = simpleCols[mapping.amountCol];
    if (!rawAmt) continue;
    
    // Handle Brazilian format: 1.000,00 -> 1000.00
    // If it's already 1000.00 it should be fine
    if (rawAmt.includes(',') && rawAmt.lastIndexOf('.') < rawAmt.lastIndexOf(',')) {
      rawAmt = rawAmt.replace(/\./g, '').replace(',', '.');
    }

    const amount = parseFloat(rawAmt);
    if (isNaN(amount) || !rawDate) continue;

    // Parse date (DD/MM/YYYY or similar to YYYY-MM-DD)
    let date = rawDate;
    if (rawDate.includes('/')) {
       const parts = rawDate.split('/');
       if (parts.length === 3) {
         if (parts[2].length === 4) { // DD/MM/YYYY
            date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
         } else if (parts[0].length === 4) { // YYYY/MM/DD
            date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
         }
       }
    } else if (rawDate.includes('-')) {
       // Already in YYYY-MM-DD or DD-MM-YYYY
       const parts = rawDate.split('-');
       if (parts[0].length === 2 && parts[2].length === 4) {
          date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
       }
    }

    const entryType: EntryType = amount >= 0 ? 'INCOME' : 'EXPENSE';

    transactions.push({
      id: Math.random().toString(36).substr(2, 9),
      date,
      description,
      amount: Math.abs(amount),
      entryType,
    });
  }

  return transactions;
}
