import { API_BASE_URL } from '../echoes/config';

export interface EntitlementView {
  entitled: boolean;
  plan: 'quiet' | 'free';
  productId: string | null;
  state: string;
  expiresAt: string | null;
  acknowledged: boolean;
}

/**
 * Distinguishes "the store says this is not a purchase" from "we could not ask".
 * The difference matters: the first should take Quiet away, the second must not.
 */
export class VerificationUnavailable extends Error {}
export class VerificationRefused extends Error {}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new VerificationUnavailable('Could not reach the server');
  }
  if (res.status === 402) throw new VerificationRefused('That purchase could not be verified');
  if (!res.ok) throw new VerificationUnavailable(`Server said ${res.status}`);
  return (await res.json()) as T;
}

/** Hands one purchase token to the server. The server asks Play; we believe the server. */
export function verifyReceipt(productId: string, purchaseToken: string): Promise<EntitlementView> {
  return post<EntitlementView>('/v1/entitlement/receipt', { productId, purchaseToken });
}

/** Re-verifies everything Play says this Google account owns. */
export function restoreEntitlement(purchases: { productId: string; purchaseToken: string }[]): Promise<EntitlementView> {
  return post<EntitlementView>('/v1/entitlement/restore', { purchases });
}
