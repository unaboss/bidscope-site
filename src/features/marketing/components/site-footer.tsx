import { Brand } from './site-header'

export function SiteFooter() {
    return (
        <footer className="site-footer container">
            <div>
                <a href="/">
                    <Brand />
                </a>
                <p>
                    Research South African tenders.
                    <br />
                    Check the source. Decide what to pursue.
                </p>
            </div>
            <div>
                <h3>Product</h3>
                <a href="/product">Overview</a>
                <a href="/features">Features</a>
                <a href="/how-it-works">How it works</a>
                <a href="/coverage">Coverage</a>
                <a href="/pricing">Pricing</a>
                <a href="/preview">Explore the app</a>
            </div>
            <div>
                <h3>Company</h3>
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
                <a href="/faq">FAQ</a>
            </div>
            <div>
                <h3>Legal</h3>
                <a href="https://northtech.africa/privacy">Privacy Policy</a>
                <a href="https://northtech.africa/terms">Terms of Service</a>
            </div>
            <p className="copyright">
                © {new Date().getFullYear()} Bidscope.
                <br />
                All rights reserved.
            </p>
        </footer>
    )
}
