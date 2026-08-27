export interface AppVersion {
  commit: string;
  builtAt: string;
  appVersion: string;
}

export const VERSION_STORAGE_KEY = 'drachma_last_seen_version';

export const getVersionId = (version: AppVersion): string => version.commit || `${version.appVersion}:${version.builtAt}`;

export const isNewVersion = (version: AppVersion, knownVersionId: string | null | undefined): boolean => {
  return Boolean(knownVersionId && getVersionId(version) !== knownVersionId);
};

export const fetchAppVersion = async (): Promise<AppVersion> => {
  const response = await fetch('/version.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Version check failed: ${response.status}`);
  return response.json() as Promise<AppVersion>;
};
