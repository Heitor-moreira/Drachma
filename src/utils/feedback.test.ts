import { describe, expect, it } from 'vitest';
import { buildFeedbackMailto, getDeviceLabel } from './feedback';

describe('buildFeedbackMailto', () => {
  it('builds an encoded suggestion email with version and device', () => {
    const href = buildFeedbackMailto('1.0.0', 'iPhone');

    expect(href).toContain('mailto:drachma.feedback@gmail.com?');
    expect(href).toContain(`subject=${encodeURIComponent('[Drachma] Sugestão')}`);
    expect(href).toContain(`body=${encodeURIComponent('Descreva sua sugestão aqui:\r\n\r\n---\r\nVersão do app: 1.0.0\r\nDispositivo: iPhone')}`);
    expect(decodeURIComponent(href)).toContain('Descreva sua sugestão aqui:\r\n\r\n---');
  });

  it('converts browser user agents into readable device labels', () => {
    expect(getDeviceLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15')).toBe('macOS · Safari');
    expect(getDeviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1')).toBe('iPhone · Safari');
    expect(getDeviceLabel('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36')).toBe('Android · Chrome');
  });
});
