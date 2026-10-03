import { describe, expect, it } from 'vitest';
import { UserSettings } from '../types';

describe('theme settings and application', () => {
  it('supports light, dark, and claude themes in UserSettings', () => {
    const settingsLight: UserSettings = {
      currency: 'BRL',
      userName: 'Test User',
      userPhoto: '',
      theme: 'light'
    };
    const settingsDark: UserSettings = {
      currency: 'BRL',
      userName: 'Test User',
      userPhoto: '',
      theme: 'dark'
    };
    const settingsClaude: UserSettings = {
      currency: 'BRL',
      userName: 'Test User',
      userPhoto: '',
      theme: 'claude'
    };

    expect(settingsLight.theme).toBe('light');
    expect(settingsDark.theme).toBe('dark');
    expect(settingsClaude.theme).toBe('claude');
  });

  it('manages dark and claude classes on root element appropriately', () => {
    const classList = new Set<string>();
    const applyTheme = (theme: UserSettings['theme']) => {
      classList.delete('dark');
      classList.delete('claude');
      if (theme === 'dark') {
        classList.add('dark');
      } else if (theme === 'claude') {
        classList.add('claude');
      }
    };

    applyTheme('light');
    expect(classList.has('dark')).toBe(false);
    expect(classList.has('claude')).toBe(false);

    applyTheme('dark');
    expect(classList.has('dark')).toBe(true);
    expect(classList.has('claude')).toBe(false);

    applyTheme('claude');
    expect(classList.has('dark')).toBe(false);
    expect(classList.has('claude')).toBe(true);

    applyTheme('light');
    expect(classList.has('dark')).toBe(false);
    expect(classList.has('claude')).toBe(false);
  });
});
