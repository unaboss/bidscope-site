import { Brand } from './site-header'

export function SiteFooter() {
    return (
        <footer className="site-footer container">
            <div>
                <a href="/">
                    <Brand />
                </a>
                <p>
                    Relevant South African tenders,
                    <br />
                    all in one place.
                </p>
            </div>
            <div>
                <h3>Product</h3>
                <a href="/#how-it-works">Overview</a>
                <a href="/#features">Features</a>
                <a href="/preview">Explore the app</a>
            </div>
            <div>
                <h3>Company</h3>
                <a href="/#coverage">About</a>
                <a href="mailto:support@northtech.africa">Contact</a>
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
