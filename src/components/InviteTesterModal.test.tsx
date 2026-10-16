// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import InviteTesterModal, {
  DEFAULT_PROVISIONAL_PASSWORD,
  PRODUCTION_URL,
  isLocalEnvironment,
  getDefaultAppUrl,
  buildInviteMessage,
  buildWhatsAppUrl,
  buildMailtoUrl,
} from './InviteTesterModal';

describe('InviteTesterModal — Utilitários de URL e Convite', () => {
  it('detecta corretamente ambientes locais', () => {
    expect(isLocalEnvironment('localhost')).toBe(true);
    expect(isLocalEnvironment('127.0.0.1')).toBe(true);
    expect(isLocalEnvironment('meu-pc.local')).toBe(true);
    expect(isLocalEnvironment('')).toBe(true);
    expect(isLocalEnvironment('drachma.vercel.app')).toBe(false);
    expect(isLocalEnvironment('app.drachma.com')).toBe(false);
  });

  it('determina a URL padrão com base no ambiente', () => {
    // Ambiente local deve retornar PRODUCTION_URL por padrão
    expect(getDefaultAppUrl('localhost', 'http://localhost:3000')).toBe(PRODUCTION_URL);
    expect(getDefaultAppUrl('127.0.0.1', 'http://127.0.0.1:3000')).toBe(PRODUCTION_URL);

    // Ambiente de produção deve usar o origin
    expect(getDefaultAppUrl('drachma.vercel.app', 'https://drachma.vercel.app')).toBe('https://drachma.vercel.app');
  });

  it('constrói a mensagem de convite com nome, email e senha provisória', () => {
    const msg = buildInviteMessage({
      guestName: 'Carlos',
      guestEmail: 'carlos@exemplo.com',
      appUrl: 'https://drachma.vercel.app',
      password: DEFAULT_PROVISIONAL_PASSWORD,
    });

    expect(msg).toContain('Olá, Carlos!');
    expect(msg).toContain('https://drachma.vercel.app');
    expect(msg).toContain('carlos@exemplo.com');
    expect(msg).toContain(DEFAULT_PROVISIONAL_PASSWORD);
    expect(msg).toContain('No primeiro acesso, o sistema exigirá a troca para uma senha definitiva.');
  });

  it('constrói a mensagem com fallback para "Colega" quando o nome não for informado', () => {
    const msg = buildInviteMessage({
      appUrl: 'https://drachma.vercel.app',
    });

    expect(msg).toContain('Olá, Colega!');
    expect(msg).toContain(DEFAULT_PROVISIONAL_PASSWORD);
  });

  it('constrói links válidos para WhatsApp e E-mail', () => {
    const msg = 'Mensagem de teste';
    const waUrl = buildWhatsAppUrl(msg);
    expect(waUrl).toBe('https://wa.me/?text=Mensagem%20de%20teste');

    const mailto = buildMailtoUrl('test@example.com', msg);
    expect(mailto).toContain('mailto:test%40example.com');
    expect(mailto).toContain('subject=Convite%20para%20testar%20o%20Drachma');
    expect(mailto).toContain('body=Mensagem%20de%20teste');
  });
});

describe('InviteTesterModal — Componente de Interface', () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeTextMock.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(cleanup);

  it('não renderiza nada quando isOpen é false', () => {
    const { container } = render(<InviteTesterModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza os elementos acessíveis e campos do modal quando aberto', () => {
    render(<InviteTesterModal isOpen={true} onClose={vi.fn()} initialAppUrl="https://drachma.vercel.app" />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('invite-tester-title');

    expect(screen.getByText('Convidar Testador')).toBeTruthy();
    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.getByLabelText('URL do sistema')).toBeTruthy();
    expect(screen.getByLabelText('Nome do convidado')).toBeTruthy();
    expect(screen.getByLabelText('E-mail do convidado')).toBeTruthy();

    // Senha provisória destacada
    expect(screen.getByTestId('provisional-password-value').textContent).toContain(DEFAULT_PROVISIONAL_PASSWORD);
    expect(screen.getAllByText(/No primeiro acesso, o sistema exigirá a troca para uma senha definitiva\./i).length).toBeGreaterThanOrEqual(1);
  });

  it('permite alterar os campos de texto (nome, e-mail, url) e atualiza a prévia', () => {
    render(<InviteTesterModal isOpen={true} onClose={vi.fn()} initialAppUrl="https://drachma.vercel.app" />);

    const nameInput = screen.getByLabelText('Nome do convidado') as HTMLInputElement;
    const emailInput = screen.getByLabelText('E-mail do convidado') as HTMLInputElement;
    const urlInput = screen.getByLabelText('URL do sistema') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Mariana' } });
    fireEvent.change(emailInput, { target: { value: 'mariana@exemplo.com' } });
    fireEvent.change(urlInput, { target: { value: 'https://minha-versao.vercel.app' } });

    expect(nameInput.value).toBe('Mariana');
    expect(emailInput.value).toBe('mariana@exemplo.com');
    expect(urlInput.value).toBe('https://minha-versao.vercel.app');

    const preview = screen.getByTestId('invite-preview');
    expect(preview.textContent).toContain('Olá, Mariana!');
    expect(preview.textContent).toContain('mariana@exemplo.com');
    expect(preview.textContent).toContain('https://minha-versao.vercel.app');
  });

  it('copia a senha provisória isolada ao clicar no botão de copiar senha', async () => {
    render(<InviteTesterModal isOpen={true} onClose={vi.fn()} />);

    const copyPassBtn = screen.getByRole('button', { name: /Copiar senha/i });
    fireEvent.click(copyPassBtn);

    expect(writeTextMock).toHaveBeenCalledWith(DEFAULT_PROVISIONAL_PASSWORD);
    await waitFor(() => {
      expect(screen.getByText('Copiada!')).toBeTruthy();
    });
  });

  it('copia o convite completo formatado ao clicar em "Copiar convite completo"', async () => {
    render(<InviteTesterModal isOpen={true} onClose={vi.fn()} initialAppUrl="https://drachma.vercel.app" />);

    const nameInput = screen.getByLabelText('Nome do convidado');
    fireEvent.change(nameInput, { target: { value: 'Roberto' } });

    const copyInviteBtn = screen.getByRole('button', { name: /Copiar convite completo/i });
    fireEvent.click(copyInviteBtn);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const copiedContent = writeTextMock.mock.calls[0][0];
    expect(copiedContent).toContain('Olá, Roberto!');
    expect(copiedContent).toContain('https://drachma.vercel.app');
    expect(copiedContent).toContain(DEFAULT_PROVISIONAL_PASSWORD);

    await waitFor(() => {
      expect(screen.getByText('Copiado!')).toBeTruthy();
    });
  });

  it('renderiza links de WhatsApp e E-mail com codificação apropriada', () => {
    render(<InviteTesterModal isOpen={true} onClose={vi.fn()} initialAppUrl="https://drachma.vercel.app" />);

    const nameInput = screen.getByLabelText('Nome do convidado');
    const emailInput = screen.getByLabelText('E-mail do convidado');
    fireEvent.change(nameInput, { target: { value: 'Ana' } });
    fireEvent.change(emailInput, { target: { value: 'ana@teste.com' } });

    const waLink = screen.getByRole('link', { name: /Enviar pelo WhatsApp/i });
    const mailLink = screen.getByRole('link', { name: /Enviar por E-mail/i });

    expect(waLink.getAttribute('target')).toBe('_blank');
    expect(waLink.getAttribute('href')).toContain('https://wa.me/?text=');
    expect(decodeURIComponent(waLink.getAttribute('href')!)).toContain('Olá, Ana!');

    expect(mailLink.getAttribute('href')).toContain('mailto:ana%40teste.com');
    expect(mailLink.getAttribute('href')).toContain('subject=Convite%20para%20testar%20o%20Drachma');
  });

  it('chama onClose ao clicar no botão Fechar ou no backdrop', () => {
    const handleClose = vi.fn();
    render(<InviteTesterModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: 'Fechar' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('chama onClose ao pressionar a tecla Escape', () => {
    const handleClose = vi.fn();
    render(<InviteTesterModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('exibe alerta de ambiente local quando executado em localhost', () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        ...originalLocation,
        hostname: 'localhost',
        origin: 'http://localhost:3000',
      },
    });

    try {
      render(<InviteTesterModal isOpen={true} onClose={vi.fn()} />);
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeTruthy();
      expect(statusElement.textContent).toContain('Ambiente local detectado: usando URL de produção da Vercel para o convite');
    } finally {
      Object.defineProperty(window, 'location', {
        writable: true,
        configurable: true,
        value: originalLocation,
      });
    }
  });
});
