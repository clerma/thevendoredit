import Link from 'next/link';
import { getAllVendors } from '@/lib/vendors';
import VendorCard from '@/components/VendorCard';
import HeroSearch from '@/components/HeroSearch';

export default function HomePage() {
  const featuredVendors = getAllVendors()
    .filter((v) => v.is_featured || v.is_subscribed)
    .slice(0, 6);

  const popularCats = [
    { name: 'Photographers', slug: 'photographers' },
    { name: 'Wedding Venues', slug: 'wedding-venues' },
    { name: 'Florists', slug: 'florists' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="tve-hero-full">
        <div className="container-fluid px-4 px-lg-5">
          <div className="row">
            <div className="col-lg-9">
              <div className="tve-hero-eyebrow">The Acadiana Edit</div>
              <h1 className="tve-hero-headline">The best of<br />Lafayette <em>weddings,</em><br />curated by hand.</h1>
            </div>
          </div>

          <div className="row align-items-end mt-4">
            <div className="col-lg-6">
              <p style={{ fontFamily: 'var(--tve-serif-alt)', fontSize: '20px', lineHeight: 1.5, color: 'var(--tve-ink-soft)', maxWidth: '520px' }}>
                A private directory of the photographers, planners, florists and venues we trust across Lafayette, Youngsville, Broussard, Carencro and Opelousas.
              </p>
            </div>
            <div className="col-lg-6 text-lg-end mt-3 mt-lg-0">
              <div className="d-flex gap-4 justify-content-lg-end align-items-center flex-wrap">
                <Link href="/vendors" className="tve-link">Browse Vendors</Link>
                <Link href="/weddings" className="tve-link">View Real Weddings</Link>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="row mt-5 pt-4">
            <div className="col-lg-7">
              <HeroSearch />
            </div>
            <div className="col-lg-5 d-flex align-items-center gap-2 flex-wrap mt-3 mt-lg-0">
              <span style={{ fontFamily: 'var(--tve-sans)', fontSize: '11px', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--tve-muted)' }}>Popular</span>
              {popularCats.map((cat) => (
                <Link key={cat.slug} className="tve-city-chip" href={`/${cat.slug}/`}>
                  <span className="dot" />{cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured vendors strip */}
      {featuredVendors.length > 0 && (
        <section style={{ padding: '80px 0', background: '#fff', borderTop: '1px solid var(--tve-rule)' }}>
          <div className="container-fluid px-4 px-lg-5">
            <div className="d-flex align-items-end justify-content-between mb-5">
              <div>
                <div className="tve-eyebrow mb-2" style={{ color: 'var(--tve-accent)' }}>Curated picks</div>
                <h2 style={{ fontFamily: 'var(--tve-serif)', fontWeight: 400, fontSize: 'clamp(32px,4vw,48px)', margin: 0 }}>Vendors we <em>love.</em></h2>
              </div>
              <Link href="/vendors" className="tve-link d-none d-lg-block">See all vendors →</Link>
            </div>
            <div className="vgrid">
              {featuredVendors.map((v) => <VendorCard key={v.slug} vendor={v} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: '100px 0', background: 'var(--tve-ink)', color: '#fff' }}>
        <div className="container-fluid px-4 px-lg-5">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="tve-eyebrow mb-3" style={{ color: 'var(--tve-accent)' }}>For vendors</div>
              <h2 style={{ fontFamily: 'var(--tve-serif)', fontWeight: 400, fontSize: 'clamp(36px,4vw,56px)', lineHeight: '.95', margin: '0 0 20px', color: '#fff' }}>
                Get in front of every couple<br />planning an <em>Acadiana wedding.</em>
              </h2>
              <p style={{ fontFamily: 'var(--tve-serif-alt)', fontStyle: 'italic', fontSize: '18px', color: 'rgba(255,255,255,.7)', maxWidth: '520px', lineHeight: 1.55, margin: '0 0 32px' }}>
                Join Acadiana&rsquo;s most-trusted vendor directory — curated listings, real wedding features, and direct couple inquiries.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link href="/list-your-business" className="act-btn primary">List Your Business</Link>
                <Link href="/pricing" className="act-btn" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>See pricing →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
