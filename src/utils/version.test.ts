import { describe, expect, it } from 'vitest';
import { getVersionId, isNewVersion, type AppVersion } from './version';

const currentVersion: AppVersion = {
  commit: 'abc123',
  builtAt: '2026-08-17T21:00:00.000Z',
  appVersion: '1.0.0'
};

describe('version checks', () => {
  it('identifies a different deployed commit as a new version', () => {
    expect(isNewVersion(currentVersion, 'old456')).toBe(true);
    expect(isNewVersion(currentVersion, getVersionId(currentVersion))).toBe(false);
  });

  it('does not flag the first execution as an update', () => {
    expect(isNewVersion(currentVersion, undefined)).toBe(false);
    expect(isNewVersion(currentVersion, null)).toBe(false);
  });
});
