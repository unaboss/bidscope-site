import { BuildingsIcon, CaretDownIcon, CreditCardIcon, SignOutIcon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { usePlanName, useTrialDays } from '@/shared/runtime/plan'
import { usePreview } from '@/shared/runtime/preview'

/**
 * The account control in the utility bar: who is signed in, on what plan, and
 * the two account destinations plus the way out. Signing out posts to the
 * Worker, so it stays a form submission rather than a client-side redirect.
 */
export function AccountMenu() {
    const plan = usePlanName()
    const trialDays = useTrialDays()
    const preview = usePreview()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button type="button" className="account-trigger" aria-label="Account menu">
                    <span className="account-avatar" aria-hidden="true">
                        B
                    </span>
                    <CaretDownIcon size={13} aria-hidden="true" className="account-caret" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <span className="block text-[0.8125rem] font-semibold text-ink">Your workspace</span>
                    <span className="mt-0.5 block text-xs text-ink/55">
                        {plan === null
                            ? 'Loading plan…'
                            : trialDays !== null && trialDays > 0
                              ? `${plan} trial · ${trialDays} ${trialDays === 1 ? 'day' : 'days'} left`
                              : `${plan} plan`}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/profile">
                        <BuildingsIcon size={15} aria-hidden="true" />
                        Company profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/billing">
                        <CreditCardIcon size={15} aria-hidden="true" />
                        Billing
                    </Link>
                </DropdownMenuItem>
                {preview === null && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <form method="post" action="/logout" className="w-full">
                                <button type="submit" className="flex w-full items-center gap-2">
                                    <SignOutIcon size={15} aria-hidden="true" />
                                    Sign out
                                </button>
                            </form>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
