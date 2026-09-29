/**
 * Joins conditional class names. Dependency-free by design — components in this
 * app own their full class lists, so tailwind-merge conflict resolution is not
 * needed.
 */
export function cn(...classes: ReadonlyArray<string | false | null | undefined>): string
{
    return classes.filter((value): value is string => typeof value === 'string' && value.length > 0).join(' ')
}
