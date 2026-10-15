// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { DevModeWrapper, useDevMode } from './DevModeWrapper';

describe('DevModeWrapper', () => {
  beforeEach(() => {
    document.body.className = '';
  });

  afterEach(() => {
    cleanup();
    document.body.className = '';
    vi.restoreAllMocks();
  });

  it('1. renderiza o botão flutuante em modo DEV com estado inicial Tela Cheia', () => {
    render(
      <DevModeWrapper>
        <div data-testid="app-content">Conteúdo do App</div>
      </DevModeWrapper>
    );

    expect(screen.getByTestId('app-content')).toBeTruthy();
    
    // Botão flutuante existe
    const floatingBtn = screen.getByRole('button', { name: /abrir menu de proporções de tela do dev mode/i });
    expect(floatingBtn).toBeTruthy();
    expect(floatingBtn.textContent).toContain('Dev Mode');
    expect(floatingBtn.textContent).toContain('Tela Cheia');
  });

  it('2. abre e fecha o menu de proporções ao clicar no botão flutuante e no botão fechar (X)', () => {
    render(
      <DevModeWrapper>
        <div>App</div>
      </DevModeWrapper>
    );

    const floatingBtn = screen.getByRole('button', { name: /abrir menu de proporções de tela do dev mode/i });

    // Menu começa fechado
    expect(screen.queryByTestId('devmode-menu')).toBeNull();

    // Clica para abrir
    fireEvent.click(floatingBtn);
    expect(screen.getByTestId('devmode-menu')).toBeTruthy();
    expect(screen.getByText('Proporções de Tela')).toBeTruthy();
    expect(screen.getByText('390 × 844 px')).toBeTruthy();

    // Fecha pelo botão X
    const closeBtn = screen.getByRole('button', { name: /fechar menu de proporções/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('devmode-menu')).toBeNull();
  });

  it('3. ativa o Dev Mode e define o tamanho ao selecionar um preset (iPhone 16e e Galaxy A43)', () => {
    render(
      <DevModeWrapper>
        <div data-testid="inner-app">App Vivo</div>
      </DevModeWrapper>
    );

    const floatingBtn = screen.getByRole('button', { name: /abrir menu de proporções de tela do dev mode/i });
    fireEvent.click(floatingBtn);

    // Seleciona iPhone 16e
    const iphoneBtn = screen.getByRole('button', { name: /iPhone 16e 390 × 844/i });
    fireEvent.click(iphoneBtn);

    // Dev Mode ativo: container simulado é renderizado e classe aplicada ao body
    const container = screen.getByTestId('devmode-container');
    expect(container).toBeTruthy();
    expect(container.style.width).toBe('390px');
    expect(container.style.height).toBe('844px');
    expect(document.body.classList.contains('dev-mode-active')).toBe(true);
    expect(floatingBtn.textContent).toContain('iPhone 16e');

    // Seleciona Galaxy A43
    const galaxyBtn = screen.getByRole('button', { name: /Galaxy A43 412 × 915/i });
    fireEvent.click(galaxyBtn);
    expect(container.style.width).toBe('412px');
    expect(container.style.height).toBe('915px');
    expect(floatingBtn.textContent).toContain('Galaxy A43');
  });

  it('4. alterna a orientação (Retrato / Paisagem) invertendo largura e altura', () => {
    render(
      <DevModeWrapper>
        <div>App</div>
      </DevModeWrapper>
    );

    const floatingBtn = screen.getByRole('button', { name: /abrir menu de proporções de tela do dev mode/i });
    fireEvent.click(floatingBtn);

    // Ativa iPhone 16e (390 x 844)
    fireEvent.click(screen.getByRole('button', { name: /iPhone 16e 390 × 844/i }));
    const container = screen.getByTestId('devmode-container');
    expect(container.style.width).toBe('390px');
    expect(container.style.height).toBe('844px');

    // Alterna orientação no menu
    const rotateButton = screen.getByRole('button', { name: /girar orientação/i });
    fireEvent.click(rotateButton);

    // Largura e altura invertidas para paisagem (844 x 390)
    expect(container.style.width).toBe('844px');
    expect(container.style.height).toBe('390px');

    // Gira novamente para voltar ao retrato
    fireEvent.click(rotateButton);
    expect(container.style.width).toBe('390px');
    expect(container.style.height).toBe('844px');
  });

  it('5. desativa o Dev Mode voltando para tela cheia e remove classe do body', () => {
    render(
      <DevModeWrapper>
        <div data-testid="app-view">App Content</div>
      </DevModeWrapper>
    );

    const floatingBtn = screen.getByRole('button', { name: /abrir menu de proporções de tela do dev mode/i });
    fireEvent.click(floatingBtn);

    // Ativa um preset
    fireEvent.click(screen.getByRole('button', { name: /iPad 11" 820 × 1180/i }));
    expect(screen.getByTestId('devmode-container')).toBeTruthy();
    expect(document.body.classList.contains('dev-mode-active')).toBe(true);

    // Clica no botão Tela Cheia / Desativar no menu
    const fullscreenBtn = screen.getByRole('button', { name: /tela cheia \(100%\) \/ desativar/i });
    fireEvent.click(fullscreenBtn);

    // Dev mode desativado
    expect(screen.queryByTestId('devmode-container')).toBeNull();
    expect(screen.getByTestId('app-view')).toBeTruthy();
    expect(document.body.classList.contains('dev-mode-active')).toBe(false);
    expect(floatingBtn.textContent).toContain('Tela Cheia');
  });

  it('6. ativa o Modo Livre permitindo redimensionamento e exibindo handles', () => {
    render(
      <DevModeWrapper>
        <div>App</div>
      </DevModeWrapper>
    );

    const floatingBtn = screen.getByRole('button', { name: /abrir menu de proporções de tela do dev mode/i });
    fireEvent.click(floatingBtn);

    // Seleciona Modo Livre
    const freeBtn = screen.getByRole('button', { name: /modo livre redimensionável/i });
    fireEvent.click(freeBtn);

    expect(screen.getByTestId('devmode-container')).toBeTruthy();
    expect(screen.getByTestId('resize-right')).toBeTruthy();
    expect(screen.getByTestId('resize-bottom')).toBeTruthy();
    expect(screen.getByTestId('resize-corner')).toBeTruthy();
    expect(floatingBtn.textContent).toContain('Modo Livre');
  });

  it('7. fornece useDevMode context para componentes filhos manipularem presets e estado', () => {
    const TestConsumer = () => {
      const dev = useDevMode();
      if (!dev) return null;
      return (
        <div>
          <span data-testid="ctx-active">{dev.isActive ? 'sim' : 'não'}</span>
          <span data-testid="ctx-preset">{dev.activePresetName || 'nenhum'}</span>
          <button data-testid="btn-macbook" onClick={() => dev.selectPreset('MacBook 13"')}>MacBook</button>
        </div>
      );
    };

    render(
      <DevModeWrapper>
        <TestConsumer />
      </DevModeWrapper>
    );

    expect(screen.getByTestId('ctx-active').textContent).toBe('não');
    fireEvent.click(screen.getByTestId('btn-macbook'));
    expect(screen.getByTestId('ctx-active').textContent).toBe('sim');
    expect(screen.getByTestId('ctx-preset').textContent).toBe('MacBook 13"');
  });

  it('8. exibe botão de testar boas-vindas da senha google e dispara evento customizado ao clicar', () => {
    const listener = vi.fn();
    window.addEventListener('drachma:open-welcome-modal', listener);

    render(
      <DevModeWrapper>
        <div>App</div>
      </DevModeWrapper>
    );

    const floatingBtn = screen.getByRole('button', { name: /abrir menu de proporções de tela do dev mode/i });
    fireEvent.click(floatingBtn);

    const testWelcomeBtn = screen.getByRole('button', { name: /testar boas-vindas \(senha google\)/i });
    expect(testWelcomeBtn).toBeTruthy();
    expect(testWelcomeBtn.textContent).toContain('Testar Boas-vindas (Senha Google)');

    fireEvent.click(testWelcomeBtn);

    expect(listener).toHaveBeenCalled();
    expect(screen.queryByTestId('devmode-menu')).toBeNull();

    window.removeEventListener('drachma:open-welcome-modal', listener);
  });
});
