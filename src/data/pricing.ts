/**
 * The one place both prices exist in the codebase (APPEARANCE_BILLING_ADDENDUM.md §2:
 * "do not hardcode them in more than one place"). Paywall and Checkout both read from
 * here — neither screen writes ₹199 or ₹1,499 itself. Both are explicitly placeholders
 * pending the client's pricing decision.
 */
export type PlanChoice = 'annual' | 'lifetime';

export interface PriceDef {
  id: PlanChoice;
  amountLabel: string;
  term: string;
  note: string;
  ctaLabel: string;
  /** Line-item breakdown for Checkout — base + gst always sums to the headline amount. */
  base: number;
  gst: number;
  total: number;
  dueToday: number;
}

export const PRICING: Record<PlanChoice, PriceDef> = {
  annual: {
    id: 'annual',
    amountLabel: '₹199',
    term: 'a year',
    note: 'About ₹17 a month',
    ctaLabel: 'Try Quiet for 14 days',
    base: 169,
    gst: 30,
    total: 199,
    dueToday: 0,
  },
  lifetime: {
    id: 'lifetime',
    amountLabel: '₹1,499',
    term: 'once',
    note: 'No subscription at all',
    ctaLabel: 'Pay once · ₹1,499',
    base: 1270,
    gst: 229,
    total: 1499,
    dueToday: 1499,
  },
};

export const DEFAULT_PLAN: PlanChoice = 'annual';
