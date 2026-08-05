import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const API_BASE_URL = extra.apiBaseUrl || 'http://localhost:8787';

export const GOOGLE_CLIENT_IDS = {
  android: extra.googleClientIdAndroid || '',
  ios: extra.googleClientIdIos || '',
  web: extra.googleClientIdWeb || '',
};

export const googleConfigured = Boolean(GOOGLE_CLIENT_IDS.android || GOOGLE_CLIENT_IDS.ios || GOOGLE_CLIENT_IDS.web);
