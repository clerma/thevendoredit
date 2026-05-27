import { SignUp } from '@clerk/nextjs';

export const metadata = { title: 'Create Account' };

export default function SignUpPage() {
  return (
    <section className="auth-page">
      <div className="auth-split">
        <div className="auth-brand">
          <div className="auth-brand-inner">
            <div className="tve-eyebrow mb-4" style={{ color: 'rgba(255,255,255,.6)' }}>Join The Event Edit</div>
            <h2 className="auth-brand-title">Get listed.<br /><em>Get booked.</em></h2>
            <p className="auth-brand-sub">Join Acadiana&rsquo;s curated wedding vendor directory and connect with engaged couples planning their perfect wedding.</p>
            <div className="auth-brand-bullets">
              <div className="auth-bullet"><i className="ti-check" style={{ color: 'var(--tve-accent)' }} /> Free listing to get started</div>
              <div className="auth-bullet"><i className="ti-check" style={{ color: 'var(--tve-accent)' }} /> Full profile on the Listed plan</div>
              <div className="auth-bullet"><i className="ti-check" style={{ color: 'var(--tve-accent)' }} /> Featured placement available</div>
              <div className="auth-bullet"><i className="ti-check" style={{ color: 'var(--tve-accent)' }} /> Month-to-month, cancel anytime</div>
            </div>
            <a href="/pricing" className="tve-link tve-link--light mt-5 d-inline-block">See all plans →</a>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <a href="/" className="auth-back tve-eyebrow">← Back to directory</a>
            <SignUp />
          </div>
        </div>
      </div>
    </section>
  );
}
