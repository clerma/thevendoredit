import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const DATA_DIR = path.join(process.cwd(), '_data');

export interface SiteData {
  name: string;
  logo_image: string;
  tagline: string;
  description: string;
  email: string;
  facebook?: string;
  instagram?: string;
  memberstack_app_id?: string;
  memberstack_listed_plan_id?: string;
  memberstack_featured_plan_id?: string;
  memberstack_listed_price_id?: string;
  memberstack_featured_price_id?: string;
  listed_price: string;
  featured_price: string;
  listed_features: string[];
  featured_features: string[];
  paperform_inquiry_id: string;
  paperform_profile_id: string;
  paperform_listing_id: string;
  paperform_wedding_id: string;
  webhook_base_url: string;
}

export interface NavItem {
  title: string;
  url: string;
  dropdown?: Array<{ title: string; url: string }>;
}

export function getSiteData(): SiteData {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'site.yml'), 'utf8');
  return yaml.load(raw) as SiteData;
}

export function getNavData(): NavItem[] {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'nav.yml'), 'utf8');
  return yaml.load(raw) as NavItem[];
}
