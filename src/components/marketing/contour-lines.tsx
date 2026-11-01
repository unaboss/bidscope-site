export function ContourLines({ className = '' }: { readonly className?: string }) {
    return (
        <svg className={'contour-lines ' + className} viewBox="0 0 900 600" fill="none" aria-hidden="true">
            <path d="M55 590C345 505 230 143 525 94C707 64 786 118 904 196" stroke="#075441" strokeWidth="1.3" />
            <path d="M-25 581C223 588 244 384 455 303C685 215 780 213 919-20" stroke="#d49a29" strokeWidth="1.4" />
            <circle cx="343" cy="298" r="5" fill="#d49a29" />
        </svg>
    )
}
