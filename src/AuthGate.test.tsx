// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGate } from './index';

let mockAuth = {
  isPasswordRecovery: false,
  mustChangePassword: false,
};

vi.mock('./contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/ResetPasswordView', () => ({
  default: () => <div data-testid="reset-password-view">ResetPasswordView</div>,
}));

vi.mock('./components/OnboardingPasswordView', () => ({
  default: () => <div data-testid="onboarding-password-view">OnboardingPasswordView</div>,
}));

vi.mock('./contexts/SyncContext', () => ({
  SyncProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="sync-provider">{children}</div>,
}));

vi.mock('./data', () => ({
  DataProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="data-provider">{children}</div>,
}));

vi.mock('./components/DevModeWrapper', () => ({
  DevModeWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="dev-mode">{children}</div>,
}));

vi.mock('./App', () => ({
  default: () => <div data-testid="app-view">App</div>,
}));

beforeEach(() => {
  mockAuth = {
    isPasswordRecovery: false,
    mustChangePassword: false,
  };
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      ...window.location,
      pathname: '/',
    },
  });
});

afterEach(cleanup);

describe('AuthGate — Roteamento e Isolamento de Provedores', () => {
  it('renderiza ResetPasswordView em fluxo de recuperação', () => {
    mockAuth.isPasswordRecovery = true;
    render(<AuthGate />);

    expect(screen.getByTestId('reset-password-view')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-password-view')).toBeNull();
    expect(screen.queryByTestId('sync-provider')).toBeNull();
    expect(screen.queryByTestId('app-view')).toBeNull();
  });

  it('renderiza OnboardingPasswordView isolado quando mustChangePassword é true', () => {
    mockAuth.mustChangePassword = true;
    render(<AuthGate />);

    expect(screen.getByTestId('onboarding-password-view')).toBeTruthy();
    expect(screen.queryByTestId('reset-password-view')).toBeNull();
    expect(screen.queryByTestId('sync-provider')).toBeNull();
    expect(screen.queryByTestId('data-provider')).toBeNull();
    expect(screen.queryByTestId('app-view')).toBeNull();
  });

  it('renderiza App dentro de SyncProvider e DataProvider quando acesso liberado', () => {
    mockAuth.mustChangePassword = false;
    mockAuth.isPasswordRecovery = false;
    render(<AuthGate />);

    expect(screen.queryByTestId('onboarding-password-view')).toBeNull();
    expect(screen.queryByTestId('reset-password-view')).toBeNull();
    expect(screen.getByTestId('sync-provider')).toBeTruthy();
    expect(screen.getByTestId('data-provider')).toBeTruthy();
    expect(screen.getByTestId('app-view')).toBeTruthy();
  });
});
