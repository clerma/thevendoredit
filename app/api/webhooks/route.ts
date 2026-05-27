import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import https from 'https';

// ─── GitHub helper ────────────────────────────────────────────────────────────

async function githubRequest(method: string, path: string, body?: object) {
  return new Promise<{ status: number; data: unknown }>((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'thevendoredit-webhook',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode!, data: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode!, data: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getFileSha(filePath: string) {
  const { GITHUB_OWNER: owner, GITHUB_REPO: repo, GITHUB_BRANCH: branch = 'main' } = process.env;
  const res = await githubRequest('GET', `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`);
  if (res.status === 200) return (res.data as { sha: string }).sha;
  return null;
}

async function commitFile(filePath: string, content: string, message: string) {
  const { GITHUB_OWNER: owner, GITHUB_REPO: repo, GITHUB_BRANCH: branch = 'main' } = process.env;
  const sha = await getFileSha(filePath);
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const body: Record<string, unknown> = { message, content: encoded, branch };
  if (sha) body.sha = sha;
  return githubRequest('PUT', `/repos/${owner}/${repo}/contents/${filePath}`, body);
}

async function triggerRebuild() {
  const url = process.env.CLOUDCANNON_WEBHOOK;
  if (!url) return;
  return new Promise<void>((resolve) => {
    const parsed = new URL(url);
    const req = https.request({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': '2' } }, () => resolve());
    req.on('error', () => resolve());
    req.write('{}');
    req.end();
  });
}

// ─── Front-matter helpers ─────────────────────────────────────────────────────

function parseFrontmatter(markdown: string): Record<string, unknown> {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm: Record<string, unknown> = {};
  const lines = match[1].split('\n');
  let currentKey: string | null = null;
  let inArray = false;
  for (const line of lines) {
    const kv = line.match(/^(\w[\w-]*?):\s*(.*)/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim().replace(/^"|"$/g, '');
      if (val === 'true') fm[currentKey] = true;
      else if (val === 'false') fm[currentKey] = false;
      else if (val === '') { fm[currentKey] = []; inArray = true; }
      else { fm[currentKey] = val; inArray = false; }
    } else if (inArray && currentKey && line.match(/^\s+-\s+/)) {
      const item = line.replace(/^\s+-\s+"?/, '').replace(/"$/, '');
      (fm[currentKey] as string[]).push(item);
    }
  }
  return fm;
}

function extractBody(markdown: string): string {
  const match = markdown.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : '';
}

function buildVendorMarkdown(fields: Record<string, string>, existingFm: Record<string, unknown> = {}): string {
  const fm = { ...existingFm };
  const set = (k: string, v: unknown) => { if (v !== undefined && v !== null && v !== '') fm[k] = v; };

  set('title',         fields['business-name']);
  set('tagline',       fields['tagline']);
  set('category',      fields['category']);
  set('city',          fields['city']);
  set('website',       fields['website']);
  set('phone',         fields['phone']);
  set('email',         fields['email']);
  set('instagram',     fields['instagram']);
  set('facebook',      fields['facebook']);
  set('hero_image',    fields['hero-image']);

  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    if (k === '_body') continue;
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      v.forEach((item) => lines.push(`  - "${String(item).replace(/"/g, '\\"')}"`));
    } else if (typeof v === 'boolean') {
      lines.push(`${k}: ${v}`);
    } else if (typeof v === 'string') {
      lines.push(`${k}: "${v.replace(/"/g, '\\"')}"`);
    }
  }
  lines.push('---', '', fields['bio'] || (existingFm._body as string) || '');
  return lines.join('\n');
}

// ─── Paperform handler ────────────────────────────────────────────────────────

async function handlePaperform(body: string) {
  const submission = JSON.parse(body);
  const fields: Record<string, string> = {};
  const rawData: Array<{ key: string; value: string }> = submission.data || submission.answers || [];
  rawData.forEach(({ key, value }) => { fields[key] = value; });

  const email = fields['email'];
  const vendorSlug = (fields['vendor-slug'] || '').trim();

  if (!vendorSlug) throw new Error('vendor-slug missing from Paperform submission');

  const { GITHUB_OWNER: owner, GITHUB_REPO: repo, GITHUB_BRANCH: branch = 'main' } = process.env;
  const filePath = `_vendors/${vendorSlug}.md`;

  const existing = await githubRequest('GET', `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`);
  let existingFm: Record<string, unknown> = {};
  if (existing.status === 200) {
    const decoded = Buffer.from((existing.data as { content: string }).content, 'base64').toString('utf8');
    existingFm = parseFrontmatter(decoded);
    existingFm._body = extractBody(decoded);
  }

  // Find the Clerk user by email and stamp memberstack_id (repurposed as clerk_user_id)
  const client = await clerkClient();
  const users = await client.users.getUserList({ emailAddress: [email] });
  const clerkUser = users.data[0];
  if (clerkUser) {
    existingFm.memberstack_id = clerkUser.id; // keeps the field name; just stores Clerk ID now

    // Sync profile fields into Clerk publicMetadata so account page has them immediately
    await client.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        vendorSlug,
        businessName:  fields['business-name'] || '',
        tagline:       fields['tagline']        || '',
        category:      fields['category']       || '',
        city:          fields['city']           || '',
        phone:         fields['phone']          || '',
        website:       fields['website']        || '',
        instagram:     fields['instagram']      || '',
        facebook:      fields['facebook']       || '',
        heroImage:     fields['hero-image']     || '',
      },
    });
  }

  const markdown = buildVendorMarkdown(fields, existingFm);
  const result = await commitFile(filePath, markdown, `Update vendor profile: ${fields['business-name'] || vendorSlug}`);
  if ((result.status) >= 400) throw new Error(`GitHub commit failed: ${JSON.stringify(result.data)}`);

  await triggerRebuild();
  return { message: 'Profile updated', vendor: vendorSlug };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const source = req.nextUrl.searchParams.get('source');
  if (!source) return NextResponse.json({ error: 'Missing ?source param' }, { status: 400 });

  try {
    const body = await req.text();
    if (source === 'paperform') {
      const result = await handlePaperform(body);
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });
  } catch (err) {
    console.error('[webhook]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get('source');
  if (source !== 'debug') return NextResponse.json({ error: 'GET only for ?source=debug' }, { status: 405 });

  const email = req.nextUrl.searchParams.get('email') ?? '';
  const client = await clerkClient();
  const users = email ? await client.users.getUserList({ emailAddress: [email] }) : { data: [] };
  const user = users.data[0] ?? null;

  return NextResponse.json({
    email,
    userFound: !!user,
    userId: user?.id ?? null,
    publicMetadata: user?.publicMetadata ?? null,
  });
}
