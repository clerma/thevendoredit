import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

const VENDORS_DIR = path.join(process.cwd(), '_vendors');

export interface Vendor {
  slug: string;
  title: string;
  tagline?: string;
  category?: string;
  category_slug?: string;
  city?: string;
  cities?: string[];
  website?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  price_range?: string;
  service_area?: string;
  hero_image?: string;
  gallery?: string[];
  is_subscribed: boolean;
  is_featured: boolean;
  memberstack_id?: string;
  plan?: string;
  editorial_pick?: boolean;
  packages?: Array<{ name: string; price?: string; description?: string; featured?: boolean }>;
  contentHtml?: string;
}

export function getAllVendorSlugs(): string[] {
  return fs
    .readdirSync(VENDORS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export function getAllVendors(): Vendor[] {
  return getAllVendorSlugs()
    .map((slug) => getVendor(slug))
    .filter((v): v is Vendor => v !== null);
}

export function getVendor(slug: string): Vendor | null {
  const filePath = path.join(VENDORS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(raw);
  return {
    slug,
    title: data.title || slug,
    tagline: data.tagline,
    category: data.category,
    category_slug: data.category_slug,
    city: data.city,
    cities: data.cities,
    website: data.website,
    phone: data.phone,
    email: data.email,
    instagram: data.instagram,
    facebook: data.facebook,
    price_range: data.price_range,
    service_area: data.service_area,
    hero_image: data.hero_image,
    gallery: data.gallery,
    is_subscribed: !!data.is_subscribed,
    is_featured: !!data.is_featured,
    memberstack_id: data.memberstack_id || '',
    plan: data.plan || 'entry',
    editorial_pick: !!data.editorial_pick,
    packages: data.packages,
  };
}

export async function getVendorWithContent(slug: string): Promise<Vendor | null> {
  const filePath = path.join(VENDORS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const processed = await remark().use(remarkHtml).process(content);
  return {
    slug,
    title: data.title || slug,
    tagline: data.tagline,
    category: data.category,
    category_slug: data.category_slug,
    city: data.city,
    cities: data.cities,
    website: data.website,
    phone: data.phone,
    email: data.email,
    instagram: data.instagram,
    facebook: data.facebook,
    price_range: data.price_range,
    service_area: data.service_area,
    hero_image: data.hero_image,
    gallery: data.gallery,
    is_subscribed: !!data.is_subscribed,
    is_featured: !!data.is_featured,
    memberstack_id: data.memberstack_id || '',
    plan: data.plan || 'entry',
    editorial_pick: !!data.editorial_pick,
    packages: data.packages,
    contentHtml: processed.toString(),
  };
}
