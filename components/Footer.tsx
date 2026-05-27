import Image from 'next/image';
import Link from 'next/link';
import { getSiteData } from '@/lib/site';

export default function Footer() {
  const site = getSiteData();
  const year = new Date().getFullYear();
  return (
    <footer style={{ padding: '60px 0 40px', background: '#fff', borderTop: '1px solid var(--tve-rule)' }}>
      <div className="container-fluid px-4 px-lg-5 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <Link href="/" className="tve-wordmark" style={{ textDecoration: 'none' }}>
          <Image src={site.logo_image} alt={site.name} width={120} height={36} style={{ height: '32px', width: 'auto' }} />
        </Link>
        <div style={{ fontFamily: 'var(--tve-sans)', fontSize: '12px', color: 'var(--tve-muted)', letterSpacing: '.08em' }}>
          &copy; {year} &middot; Lafayette, Louisiana &middot; {site.email}
        </div>
      </div>
    </footer>
  );
}
