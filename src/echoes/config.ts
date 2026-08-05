import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const API_BASE_URL = extra.apiBaseUrl || 'http://localhost:8787';

export const GOOGLE_CLIENT_IDS = {
  android: extra.googleClientIdAndroid || '',
  ios: extra.googleClientIdIos || '',
  web: extra.googleClientIdWeb || '',
};

/**
 * The web client ID is the one that decides whether sign-in can work: the native SDK
 * needs it to return an ID token on Android, and the server needs it in its audience
 * list to accept that token. The Android client still has to exist in Google Cloud
 * Console (matched by package name + SHA-1) but is never referenced in code.
 */
export const googleConfigured = Boolean(GOOGLE_CLIENT_IDS.web);
