import { useCallback, useState } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_IDS, googleConfigured } from './config';
import { googleAuth, ApiError } from './api';

export interface AuthedSession {
  token: string;
  created: boolean;
}

/**
 * Native Google Sign-In rather than an in-browser OAuth redirect.
 *
 * Google no longer accepts custom URI scheme redirects on Android, which is what a
 * browser-based expo-auth-session flow depends on — so the native SDK is the only
 * workable path. It hands back an ID token directly, no PKCE code exchange and no
 * client secret in the binary.
 *
 * Note `webClientId` is what makes Android return an ID token at all; the Android
 * OAuth client is still required in Google Cloud Console (it's matched by package
 * name + SHA-1 behind the scenes) but is never named here.
 */
let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_CLIENT_IDS.web || undefined,
    iosClientId: GOOGLE_CLIENT_IDS.ios || undefined,
    scopes: ['email'],
  });
  configured = true;
}

/**
 * The native SDK reports failures as a `code` on the error, and its message is usually
 * just the code repeated — which tells a user nothing and, worse, tells whoever is
 * debugging the build nothing either. DEVELOPER_ERROR in particular has exactly one
 * cause worth naming: the certificate this build is signed with is not on an Android
 * OAuth client, so it appears only in release builds and never on the machine that
 * made them.
 */
function describeSignInError(err: unknown): string {
  const code = (err as { code?: string | number })?.code;
  const raw = err instanceof Error ? err.message : '';
  switch (String(code)) {
    case 'DEVELOPER_ERROR':
    case '10':
      return "This build's signing certificate isn't registered for Google sign-in. Nothing is wrong with your account.";
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return 'Google Play services is missing or needs updating on this device.';
    case statusCodes.IN_PROGRESS:
      return 'Already signing in.';
    case statusCodes.SIGN_IN_CANCELLED:
      return 'Signing in was cancelled.';
    default:
      // Keep the code visible: an unnamed failure here is very hard to chase down later.
      return raw ? `Google sign-in failed${code ? ` (${code})` : ''}: ${raw}` : `Google sign-in failed${code ? ` (${code})` : ''}`;
  }
}

export function useGoogleSignIn(onSuccess: (session: AuthedSession) => void, onError: (message: string) => void) {
  const [exchanging, setExchanging] = useState(false);

  const signIn = useCallback(async () => {
    if (!googleConfigured) {
      onError('Google sign-in is not configured on this build.');
      return;
    }
    setExchanging(true);
    try {
      ensureConfigured();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type === 'cancelled') return;

      const idToken = response.data.idToken;
      if (!idToken) throw new Error('Google returned no ID token — check that webClientId is set.');

      // The client never decides who you are; the server verifies this token against
      // Google's JWKS and is the only thing that issues a session.
      const session = await googleAuth(idToken);
      onSuccess(session);
    } catch (err) {
      if (err instanceof ApiError) onError(err.message);
      else onError(describeSignInError(err));
    } finally {
      setExchanging(false);
    }
  }, [onSuccess, onError]);

  return {
    ready: googleConfigured,
    configured: googleConfigured,
    exchanging,
    signIn,
  };
}

/** Clears the native session so the account chooser appears again on next sign-in. */
export async function googleSignOutNative(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // best-effort; our own session token is cleared regardless
  }
}
