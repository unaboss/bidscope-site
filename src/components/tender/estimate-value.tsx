import type { ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { estimateSource, formatEstimate, isRoughEstimate, type ValueEstimate } from '@/lib/estimate'
import { cn } from '@/lib/utils'

const ROUGH_NOTE = 'DeepSeek’s rough range from the scope alone. The tender gives no price, CIDB grade or award history to go on.'

interface EstimateValueProps
{
    readonly estimate: ValueEstimate | null
    readonly className?: string
}

/** The estimate with where it came from beside it. A rough AI range always carries its label. */
export function EstimateValue({ estimate, className }: EstimateValueProps): ReactElement
{
    if (estimate === null) {
        return <span className={cn('text-ink/55', className)}>Not known yet</span>
    }

    const rough = isRoughEstimate(estimate)

    return (
        <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
            <span className="tabular-nums text-ink">{rough && '≈ '}{formatEstimate(estimate)}</span>
            {rough
                ? <Badge tone="warn" title={ROUGH_NOTE}>Rough AI estimate</Badge>
                : <span className="text-xs text-ink/55">{estimateSource(estimate)}</span>}
        </span>
    )
}

/** The amount alone for a tight row corner, still marked when it is only a rough AI range. */
export function EstimateCompact({ estimate, className }: EstimateValueProps): ReactElement | null
{
    if (estimate === null) {
        return null
    }

    const rough = isRoughEstimate(estimate)

    return (
        <span className={cn('tabular-nums', className)} title={rough ? ROUGH_NOTE : estimateSource(estimate)}>
            {rough && '≈ '}{formatEstimate(estimate, true)}
            {rough && <span className="ms-1 text-warn">AI est.</span>}
        </span>
    )
}
