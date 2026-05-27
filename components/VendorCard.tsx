import Link from 'next/link';
import type { Vendor } from '@/lib/vendors';

const PLACEHOLDER = '/assets/img/Unknown.avif';

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  const img = vendor.hero_image || PLACEHOLDER;
  return (
    <div className="vcard-wrap vcard"
      data-cat={vendor.category_slug ?? ''}
      data-city={(vendor.cities ?? [vendor.city]).filter(Boolean).map((c) => c!.toLowerCase()).join(',')}>
      <Link href={`/vendors/${vendor.slug}/`} className="vcard">
        <div className="vcard-img" style={{ backgroundImage: `url('${img}')` }}>
          {vendor.is_featured && <span className="vcard-badge">Featured</span>}
          {!vendor.is_subscribed && <span className="vcard-badge vcard-badge--unclaimed">Unclaimed</span>}
        </div>
        <div className="vcard-body">
          <div className="vname">{vendor.title}</div>
          {vendor.tagline && <div className="vtagline">{vendor.tagline}</div>}
          <div className="vmeta">
            {vendor.city && <span>{vendor.city}</span>}
            {vendor.category && <><span className="dot" /><span>{vendor.category}</span></>}
          </div>
        </div>
      </Link>
    </div>
  );
}
