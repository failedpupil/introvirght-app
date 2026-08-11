import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useIAP } from 'expo-iap';
import type { Product, Purchase } from 'expo-iap';
import { ALL_SKUS, ONE_TIME_SKUS, PlanChoice, PLANS, SUBSCRIPTION_SKUS, planForSku } from '../data/pricing';
import { EntitlementView, restoreEntitlement, VerificationRefused, verifyReceipt } from './api';
import { useApp } from '../state/AppState';

/**
 * Every state the paywall can be in (RELEASE_ADDENDUM.md §3.5). The paywall renders
 * from this and nothing else, so there is no path where it assumes success.
 */
export type BillingStatus =
  | 'loading_prices'
  | 'ready'
  | 'prices_unavailable'
  | 'purchase_pending'
  | 'purchase_failed'
  | 'already_subscribed'
  | 'restore_found_nothing';

interface BillingShape {
  status: BillingStatus;
  /** Real, localised prices from the store. Empty until they load. */
  priceFor: (plan: PlanChoice) => string | null;
  entitled: boolean;
  /** Set while a purchase or restore is in flight, for spinners and disabling. */
  busy: boolean;
  buy: (plan: PlanChoice) => Promise<void>;
  restore: () => Promise<void>;
  retryPrices: () => Promise<void>;
  /** Clears a transient failure so the paywall returns to its normal face. */
  dismissStatus: () => void;
}

const BillingContext = createContext<BillingShape | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { data, setVerifiedPlan } = useApp();
  const cachedPlan = data.plan;
  const [status, setStatus] = useState<BillingStatus>('loading_prices');
  const [busy, setBusy] = useState(false);
  // Entitlement starts from the last server answer we cached, so a user who paid is
  // not locked out on a plane. The server is still the only thing that can change it.
  const [entitled, setEntitled] = useState(cachedPlan === 'quiet');
  const fetched = useRef(false);
  const buying = useRef(false);

  const applyEntitlement = useCallback(
    (view: EntitlementView) => {
      setEntitled(view.entitled);
      setVerifiedPlan(view.entitled ? 'quiet' : 'free');
    },
    [setVerifiedPlan]
  );

  /**
   * Play delivered a purchase. Verify it server-side *before* unlocking anything, then
   * acknowledge. The order is the whole point: acknowledging first and crashing before
   * the server call would leave a paid user with no entitlement and no refund, and Play
   * auto-refunds anything still unacknowledged after three days.
   */
  const onPurchase = useCallback(
    async (purchase: Purchase) => {
      const token = purchase.purchaseToken ?? null;
      const sku = purchase.id ?? purchase.ids?.[0] ?? null;
      if (!token || !sku) {
        setStatus('purchase_failed');
        setBusy(false);
        buying.current = false;
        return;
      }
      try {
        const view = await verifyReceipt(sku, token);
        applyEntitlement(view);
        if (view.entitled) {
          // Only now is it safe to acknowledge. Lifetime is non-consumable, so it must
          // never be finished as a consumable or Play would re-sell it.
          await finishTransaction({ purchase, isConsumable: false });
          setStatus('ready');
        } else {
          // Verified, but not active yet — Play's slower payment methods sit pending
          // for hours or days. Not a failure, and not something to acknowledge.
          setStatus(view.state === 'pending' ? 'purchase_pending' : 'purchase_failed');
        }
      } catch (err) {
        // A refused receipt is a real failure. An unreachable server is not, and must
        // not acknowledge — we will pick the purchase up again on the next launch.
        setStatus(err instanceof VerificationRefused ? 'purchase_failed' : 'purchase_pending');
      } finally {
        setBusy(false);
        buying.current = false;
      }
    },
    [applyEntitlement]
  );

  const { connected, products, subscriptions, fetchProducts, requestPurchase, finishTransaction, getAvailablePurchases, availablePurchases } =
    useIAP({
      onPurchaseSuccess: (p) => {
        void onPurchase(p);
      },
      onPurchaseError: () => {
        // Includes the user simply backing out of Play's sheet, which is not an error
        // worth shouting about — the paywall shows a quiet line, not an alarm.
        setBusy(false);
        buying.current = false;
        setStatus('purchase_failed');
      },
      onError: () => {
        setBusy(false);
      },
    });

  const loadPrices = useCallback(async () => {
    setStatus('loading_prices');
    try {
      await fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });
      await fetchProducts({ skus: ONE_TIME_SKUS, type: 'in-app' });
      setStatus('ready');
    } catch {
      setStatus('prices_unavailable');
    }
  }, [fetchProducts]);

  useEffect(() => {
    if (!connected || fetched.current) return;
    fetched.current = true;
    void (async () => {
      await loadPrices();
      // Silent catch-up on every launch: re-verifies what Play says this account owns,
      // which is also how a refund or an expiry taken elsewhere reaches this device.
      try {
        await getAvailablePurchases();
      } catch {
        // Offline. The cached entitlement stands.
      }
    })();
  }, [connected, loadPrices, getAvailablePurchases]);

  // Whenever Play hands us the owned-purchases list, re-verify it server-side.
  const lastVerified = useRef('');
  useEffect(() => {
    const owned = (availablePurchases ?? [])
      .map((p) => ({ productId: p.id ?? p.ids?.[0] ?? '', purchaseToken: p.purchaseToken ?? '' }))
      .filter((p) => p.productId && p.purchaseToken);
    if (owned.length === 0) return;
    const key = owned.map((o) => o.purchaseToken).sort().join('|');
    if (key === lastVerified.current) return;
    lastVerified.current = key;
    void restoreEntitlement(owned).then(applyEntitlement).catch(() => {});
  }, [availablePurchases, applyEntitlement]);

  const allProducts: Product[] = useMemo(
    () => [...(subscriptions ?? []), ...(products ?? [])] as Product[],
    [subscriptions, products]
  );

  const priceFor = useCallback(
    (plan: PlanChoice) => {
      const found = allProducts.find((p) => p.id === PLANS[plan].sku);
      return found?.displayPrice ?? null;
    },
    [allProducts]
  );

  const buy = useCallback(
    async (plan: PlanChoice) => {
      if (buying.current) return; // guards a double tap before Play's sheet appears
      if (entitled) {
        setStatus('already_subscribed');
        return;
      }
      const def = PLANS[plan];
      if (!priceFor(plan)) {
        setStatus('prices_unavailable');
        return;
      }
      buying.current = true;
      setBusy(true);
      setStatus('ready');
      try {
        await requestPurchase(
          def.kind === 'subs'
            ? { type: 'subs', request: { google: { skus: [def.sku] } } }
            : { type: 'in-app', request: { google: { skus: [def.sku] } } }
        );
        // Success arrives on the purchase listener, not here.
      } catch {
        buying.current = false;
        setBusy(false);
        setStatus('purchase_failed');
      }
    },
    [entitled, priceFor, requestPurchase]
  );

  const restore = useCallback(async () => {
    setBusy(true);
    try {
      await getAvailablePurchases();
      const owned = (availablePurchases ?? [])
        .map((p) => ({ productId: p.id ?? p.ids?.[0] ?? '', purchaseToken: p.purchaseToken ?? '' }))
        .filter((p) => p.productId && p.purchaseToken);
      if (owned.length === 0) {
        setStatus('restore_found_nothing');
        return;
      }
      const view = await restoreEntitlement(owned);
      applyEntitlement(view);
      setStatus(view.entitled ? 'already_subscribed' : 'restore_found_nothing');
    } catch {
      setStatus('restore_found_nothing');
    } finally {
      setBusy(false);
    }
  }, [getAvailablePurchases, availablePurchases, applyEntitlement]);

  const value = useMemo<BillingShape>(
    () => ({
      status,
      priceFor,
      entitled,
      busy,
      buy,
      restore,
      retryPrices: loadPrices,
      dismissStatus: () => setStatus('ready'),
    }),
    [status, priceFor, entitled, busy, buy, restore, loadPrices]
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingShape {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used within BillingProvider');
  return ctx;
}

export { PLANS, planForSku };
