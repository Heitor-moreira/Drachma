import { describe, it, expect } from 'vitest';
import { parseOFX } from '../ofxParser';
import { parseCSV, CSVColumnMapping } from '../csvParser';

describe('OFX Parser', () => {
  it('should parse an OFX file correctly', () => {
    const ofxContent = `
      <OFX>
        <BANKMSGSRSV1>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20231024120000[-03:EST]</DTPOSTED>
            <TRNAMT>-150.50</TRNAMT>
            <FITID>123456789</FITID>
            <MEMO>Compra no Mercado</MEMO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20231025120000[-03:EST]</DTPOSTED>
            <TRNAMT>2000.00</TRNAMT>
            <FITID>987654321</FITID>
            <NAME>Salário</NAME>
          </STMTTRN>
        </BANKMSGSRSV1>
      </OFX>
    `;

    const result = parseOFX(ofxContent);
    expect(result).toHaveLength(2);

    expect(result[0].amount).toBe(150.5);
    expect(result[0].entryType).toBe('EXPENSE');
    expect(result[0].date).toBe('2023-10-24');
    expect(result[0].description).toBe('Compra no Mercado');
    expect(result[0].fitid).toBe('123456789');

    expect(result[1].amount).toBe(2000);
    expect(result[1].entryType).toBe('INCOME');
    expect(result[1].date).toBe('2023-10-25');
    expect(result[1].description).toBe('Salário');
    expect(result[1].fitid).toBe('987654321');
  });
});

describe('CSV Parser', () => {
  it('should parse a CSV file correctly', () => {
    const csvContent = `Data;Descrição;Valor
24/10/2023;Compra no Mercado;-150,50
25/10/2023;Salário;2.000,00`;

    const mapping: CSVColumnMapping = {
      dateCol: 0,
      descriptionCol: 1,
      amountCol: 2
    };

    const result = parseCSV(csvContent, ';', mapping, true);
    expect(result).toHaveLength(2);

    expect(result[0].amount).toBe(150.5);
    expect(result[0].entryType).toBe('EXPENSE');
    expect(result[0].date).toBe('2023-10-24');
    expect(result[0].description).toBe('Compra no Mercado');

    expect(result[1].amount).toBe(2000);
    expect(result[1].entryType).toBe('INCOME');
    expect(result[1].date).toBe('2023-10-25');
    expect(result[1].description).toBe('Salário');
  });
});
