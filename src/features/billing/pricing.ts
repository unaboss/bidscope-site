import type { PricingTier } from '@/shared/api'

/** Mirrors worker/domain/pricing.ts; keep the two in step. */

export type Billing = 'monthly' | 'annual'

/** Monthly base price per tier in ZAR cents. */
export const TIER_CENTS: Readonly<Record<PricingTier, number>> = {
    single: 39900,
    mid: 69900,
    all: 89900,
}

export const TIER_NAMES: Readonly<Record<PricingTier, string>> = {
    single: 'Starter',
    mid: 'Growth',
    all: 'Pro',
}

/** Provinces included in the base price, and the most a plan can carry with add-ons. */
export const INCLUDED_PROVINCES: Readonly<Record<PricingTier, number>> = { single: 1, mid: 4, all: 9 }
export const MAX_PROVINCES: Readonly<Record<PricingTier, number>> = { single: 3, mid: 8, all: 9 }

/** Each extra province, per month. */
export const PROVINCE_ADDON_CENTS = 10000

/** Yearly billing: ten months for twelve. */
export const ANNUAL_MONTHS_CHARGED = 10

/** The launch promo: 50% off Growth and Pro for the first 6 months (monthly billing). */
export const PROMO_PERCENT = 50
export const PROMO_MONTHS = 6

/** The tier that covers a province count with no add-ons (0 means nationwide). */
export function tierForProvinces(count: number): PricingTier
{
    if (count === 1)
    {
        return 'single'
    }

    return count >= 2 && count <= 4 ? 'mid' : 'all'
}

export function isPromoTier(tier: PricingTier): boolean
{
    return tier === 'mid' || tier === 'all'
}

export function addonProvinces(tier: PricingTier, count: number): number
{
    return tier === 'all' ? 0 : Math.max(0, count - INCLUDED_PROVINCES[tier])
}

export function monthlyTotalCents(tier: PricingTier, count: number): number
{
    return TIER_CENTS[tier] + addonProvinces(tier, count) * PROVINCE_ADDON_CENTS
}

export function annualCents(tier: PricingTier, count: number): number
{
    return monthlyTotalCents(tier, count) * ANNUAL_MONTHS_CHARGED
}

/** The promo monthly price, rounded down to whole rands (R699 → R349). */
export function promoCents(tier: PricingTier, count: number = 0): number
{
    return Math.floor(monthlyTotalCents(tier, count) * (100 - PROMO_PERCENT) / 100 / 100) * 100
}

export function isPricingTier(value: string | null): value is PricingTier
{
    return value === 'single' || value === 'mid' || value === 'all'
}

export function isBilling(value: string | null): value is Billing
{
    return value === 'monthly' || value === 'annual'
}
