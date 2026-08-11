/**
 * The Play products, and the copy around them.
 *
 * There are deliberately **no prices in this file**. Play localises every price and
 * requires the local currency be shown, so the only correct price is the `displayPrice`
 * on the `ProductDetails` the store hands back at runtime (RELEASE_ADDENDUM.md §3.1).
 * A hardcoded "₹199" would be wrong for most of the world and stale for the rest.
 *
 * The ids below are shared with Play Console and with the server's
 * `src/billing/products.ts`. All three must agree exactly.
 */
export type PlanChoice = 'annual' | 'monthly' | 'lifetime';

export interface PlanDef {
  id: PlanChoice;
  /** The Play product id. Must match Play Console and the server. */
  sku: string;
  /** Play sells subscriptions and one-time products through different calls. */
  kind: 'subs' | 'in-app';
  /** The word after the price: "₹199 a year". */
  term: string;
  /** Shown under the price. Must not state an amount — see the note above. */
  note: string;
}

export const PLANS: Record<PlanChoice, PlanDef> = {
  annual: {
    id: 'annual',
    sku: 'introvirght_year',
    kind: 'subs',
    term: 'a year',
    note: 'The usual choice, and the cheapest by the month.',
  },
  monthly: {
    id: 'monthly',
    sku: 'introvirght_month',
    kind: 'subs',
    term: 'a month',
    note: 'If you would rather not commit to a year.',
  },
  lifetime: {
    id: 'lifetime',
    sku: 'introvirght_lifetime',
    kind: 'in-app',
    term: 'once',
    note: 'No subscription at all. Every future version included.',
  },
};

export const PLAN_ORDER: PlanChoice[] = ['annual', 'monthly', 'lifetime'];
export const DEFAULT_PLAN: PlanChoice = 'annual';

export const ALL_SKUS = PLAN_ORDER.map((p) => PLANS[p].sku);
export const SUBSCRIPTION_SKUS = PLAN_ORDER.filter((p) => PLANS[p].kind === 'subs').map((p) => PLANS[p].sku);
export const ONE_TIME_SKUS = PLAN_ORDER.filter((p) => PLANS[p].kind === 'in-app').map((p) => PLANS[p].sku);

export function planForSku(sku: string): PlanDef | undefined {
  return PLAN_ORDER.map((p) => PLANS[p]).find((p) => p.sku === sku);
}
