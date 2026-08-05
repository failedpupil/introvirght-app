import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_CLIENT_IDS, googleConfigured } from './config';
import { googleAuth, ApiError } from './api';

WebBrowser.maybeCompleteAuthSession();

function platformGoogleClientId(): string {
  if (Platform.OS === 'android') return GOOGLE_CLIENT_IDS.android || GOOGLE_CLIENT_IDS.web;
  if (Platform.OS === 'ios') return GOOGLE_CLIENT_IDS.ios || GOOGLE_CLIENT_IDS.web;
  return GOOGLE_CLIENT_IDS.web;
}

export interface AuthedSession {
  token: string;
  created: boolean;
}

/**
 * Authorization Code + PKCE, no client secret shipped in the binary (usePKCE defaults
 * to true; we set it explicitly). The client never sees or trusts the ID token itself —
 * it's forwarded to the server, which is the only place identity is decided.
 */
export function useGoogleSignIn(onSuccess: (session: AuthedSession) => void, onError: (message: string) => void) {
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  const clientId = platformGoogleClientId();
  const redirectUri = useMemo(() => AuthSession.makeRedirectUri({ scheme: 'introvirght' }), []);
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['openid', 'email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    if (!response || !discovery || !request) return;
    if (response.type === 'success') {
      setExchanging(true);
      AuthSession.exchangeCodeAsync(
        {
          clientId,
          code: response.params.code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier ?? '' },
        },
        discovery
      )
        .then((tokenResponse) => {
          if (!tokenResponse.idToken) throw new Error('Google did not return an ID token');
          return googleAuth(tokenResponse.idToken);
        })
        .then(onSuccess)
        .catch((err) => onError(err instanceof ApiError ? err.message : 'Google sign-in failed'))
        .finally(() => setExchanging(false));
    } else if (response.type === 'error') {
      onError(response.error?.message ?? 'Google sign-in was cancelled');
    }
    // response identity change is the only thing that should re-trigger this exchange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    ready: Boolean(request) && googleConfigured,
    configured: googleConfigured,
    exchanging,
    signIn: () => promptAsync(),
  };
}
