export const getDeviceLabel = (userAgent: string) => {
  const device = /iPhone/i.test(userAgent) ? 'iPhone'
    : /iPad/i.test(userAgent) ? 'iPad'
      : /Android/i.test(userAgent) ? 'Android'
        : /Windows/i.test(userAgent) ? 'Windows'
          : /Macintosh|Mac OS X/i.test(userAgent) ? 'macOS'
            : /Linux/i.test(userAgent) ? 'Linux' : 'Dispositivo desconhecido';
  const browser = /Edg\//i.test(userAgent) ? 'Edge'
    : /Firefox\//i.test(userAgent) ? 'Firefox'
      : /CriOS\//i.test(userAgent) ? 'Chrome'
        : /Chrome\//i.test(userAgent) ? 'Chrome'
          : /Safari\//i.test(userAgent) ? 'Safari' : 'navegador desconhecido';
  return `${device} · ${browser}`;
};

export const buildFeedbackMailto = (version: string, device: string) => {
  const subject = '[Drachma] Sugestão';
  const body = `Descreva sua sugestão aqui:\r\n\r\n---\r\nVersão do app: ${version}\r\nDispositivo: ${device}`;
  return `mailto:drachma.feedback@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
