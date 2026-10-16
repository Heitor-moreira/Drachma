import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  MessageCircle,
  Mail,
  UserPlus,
  KeyRound,
  Info,
  Globe
} from 'lucide-react';

export const DEFAULT_PROVISIONAL_PASSWORD = 'senhapadrao123';
export const PRODUCTION_URL = 'https://drachma.vercel.app';

/**
 * Detecta se o host fornecido ou o atual é um ambiente local (localhost, 127.0.0.1, etc.).
 */
export const isLocalEnvironment = (hostname?: string): boolean => {
  const host = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || host === '';
};

/**
 * Determina a URL padrão do app com base no ambiente (produção Vercel para ambiente local, origin para produção).
 */
export const getDefaultAppUrl = (hostname?: string, origin?: string): string => {
  const isLocal = isLocalEnvironment(hostname);
  if (isLocal) {
    const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL;
    return envUrl || PRODUCTION_URL;
  }
  const org = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return org || PRODUCTION_URL;
};

/**
 * Gera a mensagem formatada de convite para compartilhamento.
 */
export const buildInviteMessage = ({
  guestName,
  guestEmail,
  appUrl,
  password = DEFAULT_PROVISIONAL_PASSWORD,
}: {
  guestName?: string;
  guestEmail?: string;
  appUrl: string;
  password?: string;
}): string => {
  const name = guestName?.trim() || 'Colega';
  const emailLine = guestEmail?.trim() ? `• E-mail de acesso: ${guestEmail.trim()}\n` : '';

  return `Olá, ${name}!

Você foi convidado(a) para testar o Drachma — Finanças descomplicadas.

Acesse o sistema pelo link:
${appUrl}

Credenciais de acesso provisório:
${emailLine}• Senha provisória: ${password}

No primeiro acesso, o sistema exigirá a troca para uma senha definitiva.

Qualquer dúvida ou sugestão, estamos à disposição!`;
};

/**
 * Gera a URL para compartilhamento no WhatsApp.
 */
export const buildWhatsAppUrl = (message: string): string => {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

/**
 * Gera a URL para envio via cliente de E-mail padrão (mailto).
 */
export const buildMailtoUrl = (email: string, message: string): string => {
  const subject = encodeURIComponent('Convite para testar o Drachma');
  const body = encodeURIComponent(message);
  const to = encodeURIComponent(email.trim());
  return `mailto:${to}?subject=${subject}&body=${body}`;
};

export interface InviteTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAppUrl?: string;
}

export const InviteTesterModal: React.FC<InviteTesterModalProps> = ({
  isOpen,
  onClose,
  initialAppUrl,
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [appUrl, setAppUrl] = useState(() => initialAppUrl || getDefaultAppUrl());
  const [isLocalHost, setIsLocalHost] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const [isInviteCopied, setIsInviteCopied] = useState(false);

  // Sincroniza ambiente e valores iniciais quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      const local = isLocalEnvironment();
      setIsLocalHost(local);
      if (!initialAppUrl) {
        setAppUrl(getDefaultAppUrl());
      }
      setIsPasswordCopied(false);
      setIsInviteCopied(false);
    }
  }, [isOpen, initialAppUrl]);

  // Suporte a fechamento pelo teclado (ESC)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const inviteMessage = useMemo(() => {
    return buildInviteMessage({
      guestName,
      guestEmail,
      appUrl,
      password: DEFAULT_PROVISIONAL_PASSWORD,
    });
  }, [guestName, guestEmail, appUrl]);

  const whatsAppUrl = useMemo(() => buildWhatsAppUrl(inviteMessage), [inviteMessage]);
  const mailtoUrl = useMemo(() => buildMailtoUrl(guestEmail, inviteMessage), [guestEmail, inviteMessage]);

  const handleCopyPassword = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(DEFAULT_PROVISIONAL_PASSWORD);
      }
      setIsPasswordCopied(true);
      setTimeout(() => setIsPasswordCopied(false), 2000);
    } catch {
      // Ignora erro em ambientes sem suporte
    }
  }, []);

  const handleCopyInvite = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteMessage);
      }
      setIsInviteCopied(true);
      setTimeout(() => setIsInviteCopied(false), 2000);
    } catch {
      // Ignora erro em ambientes sem suporte
    }
  }, [inviteMessage]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0F1F3D]/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-tester-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0F1F3D] border border-[#1F3868] p-6 sm:p-8 text-[#F5EFE0] shadow-2xl overflow-y-auto max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 text-[#9AA5BA] hover:text-[#F5EFE0] p-1.5 rounded-xl hover:bg-[#162A4F] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#D9A83A]/15 text-[#D9A83A] border border-[#D9A83A]/30 flex items-center justify-center shrink-0 shadow-lg shadow-[#D9A83A]/5">
            <UserPlus size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2
                id="invite-tester-title"
                className="text-2xl text-[#F5EFE0]"
                style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 600, letterSpacing: '0.04em' }}
              >
                Convidar Testador
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D9A83A]/20 text-[#D9A83A] border border-[#D9A83A]/30">
                Admin
              </span>
            </div>
            <p className="text-xs text-[#9AA5BA]">
              Gere e envie o convite com as credenciais provisórias de acesso ao Drachma.
            </p>
          </div>
        </div>

        {/* Aviso de ambiente local se aplicável */}
        {isLocalHost && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2.5 rounded-2xl bg-[#D9A83A]/10 border border-[#D9A83A]/30 p-3.5 text-xs text-[#F0D48A]"
          >
            <Info size={18} className="shrink-0 text-[#D9A83A] mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Ambiente local detectado: usando URL de produção da Vercel para o convite</p>
              <p className="text-[#F5EFE0]/80">
                O link enviado para o convidado apontará para a versão online hospedada na Vercel.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Campo URL do Sistema */}
          <div>
            <label
              htmlFor="invite-app-url"
              className="block text-xs font-bold uppercase tracking-wider text-[#D9A83A] mb-1.5"
            >
              Link de Acesso (URL)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[#9AA5BA] pointer-events-none">
                <Globe size={18} />
              </span>
              <input
                id="invite-app-url"
                type="url"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                aria-label="URL do sistema"
                placeholder="https://drachma.vercel.app"
                className="w-full rounded-2xl bg-[#162A4F] border border-[#1F3868] py-3 pl-10 pr-4 text-sm text-[#F5EFE0] placeholder-[#9AA5BA]/50 outline-none focus:border-[#D9A83A] focus:ring-1 focus:ring-[#D9A83A] transition-all"
              />
            </div>
          </div>

          {/* Campo Nome do Convidado */}
          <div>
            <label
              htmlFor="invite-guest-name"
              className="block text-xs font-bold uppercase tracking-wider text-[#D9A83A] mb-1.5"
            >
              Nome do Convidado (Opcional)
            </label>
            <input
              id="invite-guest-name"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ex: Colega"
              aria-label="Nome do convidado"
              className="w-full rounded-2xl bg-[#162A4F] border border-[#1F3868] px-4 py-3 text-sm text-[#F5EFE0] placeholder-[#9AA5BA]/50 outline-none focus:border-[#D9A83A] focus:ring-1 focus:ring-[#D9A83A] transition-all"
            />
          </div>

          {/* Campo E-mail do Convidado */}
          <div>
            <label
              htmlFor="invite-guest-email"
              className="block text-xs font-bold uppercase tracking-wider text-[#D9A83A] mb-1.5"
            >
              E-mail do Convidado (Opcional)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[#9AA5BA] pointer-events-none">
                <Mail size={18} />
              </span>
              <input
                id="invite-guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="email@exemplo.com"
                aria-label="E-mail do convidado"
                className="w-full rounded-2xl bg-[#162A4F] border border-[#1F3868] py-3 pl-10 pr-4 text-sm text-[#F5EFE0] placeholder-[#9AA5BA]/50 outline-none focus:border-[#D9A83A] focus:ring-1 focus:ring-[#D9A83A] transition-all"
              />
            </div>
          </div>

          {/* Senha Provisória Destacada */}
          <div className="rounded-2xl bg-[#162A4F] border border-[#1F3868] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-[#D9A83A]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#D9A83A]">
                  Senha Provisória
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPassword}
                aria-label="Copiar senha"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#0F1F3D] text-[#D9A83A] border border-[#1F3868] hover:bg-[#1F3868] transition-colors"
              >
                {isPasswordCopied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar senha</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#0F1F3D]/80 rounded-xl px-4 py-2.5 border border-[#1F3868]/60">
              <span
                data-testid="provisional-password-value"
                className="font-mono text-base font-bold text-[#F5EFE0] tracking-wide"
              >
                {DEFAULT_PROVISIONAL_PASSWORD}
              </span>
            </div>

            <p className="mt-2 text-xs text-[#9AA5BA] leading-relaxed">
              No primeiro acesso, o sistema exigirá a troca para uma senha definitiva.
            </p>
          </div>

          {/* Prévia do Convite */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#D9A83A] mb-1.5">
              Prévia do Convite
            </label>
            <div
              data-testid="invite-preview"
              className="rounded-2xl bg-[#162A4F]/60 border border-[#1F3868] p-3.5 text-xs text-[#F5EFE0]/90 whitespace-pre-line font-mono max-h-36 overflow-y-auto leading-relaxed select-text"
            >
              {inviteMessage}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 space-y-2.5">
          {/* Botão Copiar Convite Completo */}
          <button
            type="button"
            onClick={handleCopyInvite}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#D9A83A] hover:bg-[#E4BC5A] active:bg-[#B88A26] text-[#0F1F3D] font-bold text-sm shadow-lg shadow-[#D9A83A]/10 transition-all cursor-pointer"
          >
            {isInviteCopied ? (
              <>
                <Check size={18} strokeWidth={2.5} />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={18} strokeWidth={2} />
                <span>Copiar convite completo</span>
              </>
            )}
          </button>

          {/* Botões de Envio Direto (WhatsApp e E-mail) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-bold transition-all text-center"
            >
              <MessageCircle size={16} />
              <span>Enviar pelo WhatsApp</span>
            </a>

            <a
              href={mailtoUrl}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#1F3868] hover:bg-[#2C4A85] border border-[#1F3868] text-[#F5EFE0] text-xs font-bold transition-all text-center"
            >
              <Mail size={16} />
              <span>Enviar por E-mail</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteTesterModal;
