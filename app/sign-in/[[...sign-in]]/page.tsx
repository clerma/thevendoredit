import { SignIn } from '@clerk/nextjs';

export const metadata = { title: 'Sign In' };

export default function SignInPage() {
  return (
    <section className="auth-page">
      <div className="auth-split">
        <div className="auth-brand">
          <div className="auth-brand-inner">
            <div className="tve-eyebrow mb-4" style={{ color: 'rgba(255,255,255,.6)' }}>Vendor Portal</div>
            <h2 className="auth-brand-title">Your listing,<br /><em>your way.</em></h2>
            <p className="auth-brand-sub">Manage your profile, update your gallery, track inquiries, and stay in front of engaged couples planning their Acadiana wedding.</p>
            <div className="auth-brand-bullets">
              <div className="auth-bullet"><i className="ti-check" style={{ color: 'var(--tve-accent)' }} /> Full profile &amp; photo gallery</div>
              <div className="auth-bullet"><i className="ti-check" style={{ color: 'var(--tve-accent)' }} /> Direct inquiry form</div>
              <div className="auth-bullet"><i className="ti-check" style={{ color: 'var(--tve-accent)' }} /> Packages &amp; pricing display</div>
              <div className="auth-bullet"><i className="ti-check" style={{ color: 'var(--tve-accent)' }} /> Real Weddings vendor credits</div>
            </div>
            <a href="/pricing" className="tve-link tve-link--light mt-5 d-inline-block">See all plans →</a>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <a href="/" className="auth-back tve-eyebrow">← Back to directory</a>
            <SignIn />
          </div>
        </div>
      </div>
    </section>
  );
}
