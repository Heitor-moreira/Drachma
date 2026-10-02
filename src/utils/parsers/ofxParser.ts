import { EntryType } from '../../types';

export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  entryType: EntryType;
  fitid?: string;
  tags?: string[];
}

export function parseOFX(ofxContent: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  const regexStmtrn = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;

  while ((match = regexStmtrn.exec(ofxContent)) !== null) {
    const block = match[1];

    const trnTypeMatch = block.match(/<TRNTYPE>(.*?)(?:\r|\n|<)/);
    const dtPostedMatch = block.match(/<DTPOSTED>(.*?)(?:\r|\n|<)/);
    const trnAmtMatch = block.match(/<TRNAMT>(.*?)(?:\r|\n|<)/);
    const fitidMatch = block.match(/<FITID>(.*?)(?:\r|\n|<)/);
    const memoMatch = block.match(/<MEMO>(.*?)(?:\r|\n|<)/);
    const nameMatch = block.match(/<NAME>(.*?)(?:\r|\n|<)/);

    const dtPosted = dtPostedMatch ? dtPostedMatch[1].trim() : '';
    const trnAmt = trnAmtMatch ? trnAmtMatch[1].trim() : '';
    const fitid = fitidMatch ? fitidMatch[1].trim() : '';
    const memo = memoMatch ? memoMatch[1].trim() : '';
    const name = nameMatch ? nameMatch[1].trim() : '';

    const description = name || memo || 'Transação';
    
    let date = '';
    if (dtPosted && dtPosted.length >= 8) {
      date = `${dtPosted.substring(0, 4)}-${dtPosted.substring(4, 6)}-${dtPosted.substring(6, 8)}`;
    }

    const amount = parseFloat(trnAmt.replace(',', '.'));
    const entryType: EntryType = amount >= 0 ? 'INCOME' : 'EXPENSE';

    transactions.push({
      id: fitid || Math.random().toString(36).substr(2, 9),
      date,
      description,
      amount: Math.abs(amount),
      entryType,
      fitid
    });
  }

  return transactions;
}
