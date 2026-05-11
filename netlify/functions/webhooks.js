/**
 * webhooks.js — Netlify Function
 *
 * Handles two inbound webhook sources:
 *   POST /webhooks?source=paperform   — Vendor profile update from Paperform
 *   POST /webhooks?source=memberstack — Membership event from Memberstack
 *
 * Required environment variables (set in Netlify dashboard → Site settings → Env vars):
 *   GITHUB_TOKEN              Personal Access Token with repo scope
 *   GITHUB_OWNER              GitHub username or org (e.g. "clerma")
 *   GITHUB_REPO               Repository name (e.g. "thevendoredit")
 *   GITHUB_BRANCH             Branch to commit to (e.g. "main")
 *   CLOUDCANNON_WEBHOOK       CloudCannon build webhook URL (triggers rebuild after commit)
 *   PAPERFORM_SECRET          Paperform webhook secret (for signature verification)
 *   MEMBERSTACK_SECRET        Memberstack webhook secret
 *   MEMBERSTACK_API_KEY       Memberstack Admin API key (for writing vendor-slug to member)
 *   MEMBERSTACK_LISTED_PLAN_ID    Plan ID for the Listed (paid) tier
 *   MEMBERSTACK_FEATURED_PLAN_ID  Plan ID for the Featured tier
 */

const https = require('https');

// ─── GitHub helper ────────────────────────────────────────────────────────────

async function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'thevendoredit-webhook',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/** Get the current SHA of a file (needed to update it). Returns null if file doesn't exist. */
async function getFileSha(filePath) {
  const owner = process.env.GITHUB_OWNER;
  const repo  = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const res = await githubRequest('GET',
    `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`
  );
  if (res.status === 200) return res.data.sha;
  return null;
}

/** Create or update a file in the repo. */
async function commitFile(filePath, content, message) {
  const owner  = process.env.GITHUB_OWNER;
  const repo   = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const sha    = await getFileSha(filePath);
  const encoded = Buffer.from(content, 'utf8').toString('base64');

  const body = { message, content: encoded, branch };
  if (sha) body.sha = sha; // required for updates

  const res = await githubRequest('PUT',
    `/repos/${owner}/${repo}/contents/${filePath}`,
    body
  );
  return res;
}

/** Trigger a CloudCannon rebuild via its build webhook. */
async function triggerRebuild() {
  const url = process.env.CLOUDCANNON_WEBHOOK;
  if (!url) return;
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': '2' },
    };
    const req = https.request(options, resolve);
    req.on('error', () => resolve(null));
    req.write('{}');
    req.end();
  });
}

// ─── Memberstack Admin API helper ────────────────────────────────────────────

async function memberstackRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'admin.memberstack.com',
      path,
      method,
      headers: {
        'X-Api-Key': process.env.MEMBERSTACK_API_KEY,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/** Find a Memberstack member by email. Returns member object or null. */
async function findMemberByEmail(email) {
  if (!process.env.MEMBERSTACK_API_KEY || !email) return null;
  const res = await memberstackRequest('GET', `/members?email=${encodeURIComponent(email)}`);
  if (res.status !== 200) return null;
  const members = Array.isArray(res.data.data) ? res.data.data : (res.data.data ? [res.data.data] : []);
  return members.length > 0 ? members[0] : null;
}

/** Write vendor-slug into a Memberstack member's custom fields. */
async function setMemberVendorSlug(memberId, vendorSlug) {
  if (!process.env.MEMBERSTACK_API_KEY || !memberId) return;
  await memberstackRequest('PATCH', `/members/${memberId}`, {
    customFields: { 'vendor-slug': vendorSlug },
  });
}

/**
 * Fallback: search GitHub repo content for a vendor file containing the email.
 * Used when Memberstack fires before handlePaperform has stamped vendor-slug.
 */
async function findVendorSlugByEmail(email) {
  if (!email) return null;
  const owner  = process.env.GITHUB_OWNER;
  const repo   = process.env.GITHUB_REPO;
  const q = encodeURIComponent(`${email} in:file repo:${owner}/${repo} path:_vendors`);
  const res = await githubRequest('GET', `/search/code?q=${q}`);
  if (res.status === 200 && res.data.items && res.data.items.length > 0) {
    return res.data.items[0].name.replace(/\.md$/, '');
  }
  return null;
}

// ─── Vendor front-matter builder ─────────────────────────────────────────────

/**
 * Build the full Jekyll front matter + body for a vendor .md file.
 * Fields come from the Paperform submission or Memberstack custom fields.
 * Only non-empty values are written.
 */
function buildVendorMarkdown(fields, existingFrontmatter = {}) {
  // Merge: existing values are overwritten only where new values provided
  const fm = Object.assign({}, existingFrontmatter);

  const set = (key, val) => { if (val !== undefined && val !== null && val !== '') fm[key] = val; };

  set('title',         fields['business-name']);
  set('tagline',       fields['tagline']);
  set('category',      fields['category']);
  set('category_slug', fields['category-slug'] || slugify(fields['category'] || ''));
  set('city',          fields['city']);
  set('cities',        fields['cities'] ? fields['cities'].split(',').map(s => s.trim()) : undefined);
  set('website',       fields['website']);
  set('phone',         fields['phone']);
  set('email',         fields['email']);
  set('instagram',     fields['instagram']);
  set('facebook',      fields['facebook']);
  set('hero_image',    fields['hero-image']);
  // is_subscribed is managed exclusively by the Memberstack webhook — never override it here
  set('is_featured',   fm.is_featured || false);

  // Gallery: comma-separated image URLs
  if (fields['gallery']) {
    fm.gallery = fields['gallery'].split(',').map(s => s.trim()).filter(Boolean);
  }

  // Packages (JSON string from multi-line Paperform field)
  if (fields['packages']) {
    try { fm.packages = JSON.parse(fields['packages']); }
    catch(e) { /* ignore malformed JSON */ }
  }

  // Build YAML front matter manually (avoid dependencies)
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      v.forEach(item => {
        if (typeof item === 'object') {
          lines.push(`  - name: "${(item.name || '').replace(/"/g, '\\"')}"`);
          if (item.price) lines.push(`    price: "${(item.price || '').replace(/"/g, '\\"')}"`);
          if (item.description) lines.push(`    description: "${(item.description || '').replace(/"/g, '\\"')}"`);
        } else {
          lines.push(`  - "${String(item).replace(/"/g, '\\"')}"`);
        }
      });
    } else if (typeof v === 'boolean') {
      lines.push(`${k}: ${v}`);
    } else if (typeof v === 'string') {
      lines.push(`${k}: "${v.replace(/"/g, '\\"')}"`);
    }
  }
  lines.push('---');

  const bio = fields['bio'] || existingFrontmatter._body || '';
  lines.push('');
  lines.push(bio);

  return lines.join('\n');
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Paperform handler ────────────────────────────────────────────────────────

async function handlePaperform(body) {
  const submission = typeof body === 'string' ? JSON.parse(body) : body;

  // Paperform sends answers as an array: [{ key, value }, ...]
  const fields = {};
  (submission.data || []).forEach(({ key, value }) => { fields[key] = value; });

  const email = fields['email'];

  // Look up the Memberstack member by email first — we need the member before
  // building the markdown (to stamp memberstack_id) and to sync custom fields.
  let member = null;
  if (email) {
    member = await findMemberByEmail(email);
  }

  // Resolve the vendor slug: prefer the form field, then the member's stored
  // custom field, then search GitHub by email as a last resort.
  let vendorSlug = fields['vendor-slug'];
  if (!vendorSlug && member) {
    vendorSlug = (member.customFields || {})['vendor-slug'] || '';
  }
  if (!vendorSlug && email) {
    vendorSlug = await findVendorSlugByEmail(email) || '';
  }
  if (!vendorSlug) {
    console.error('[paperform] No vendor-slug resolved for email:', email);
    throw new Error('Cannot identify vendor — ensure the vendor-slug field is filled in the form.');
  }

  const filePath = `_vendors/${vendorSlug}.md`;

  // Read existing front matter to preserve fields not in this submission
  const existing = await githubRequest('GET',
    `/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${filePath}?ref=${process.env.GITHUB_BRANCH || 'main'}`
  );

  let existingFm = {};
  if (existing.status === 200) {
    const decoded = Buffer.from(existing.data.content, 'base64').toString('utf8');
    existingFm = parseFrontmatter(decoded);
  }

  // Stamp the memberstack_id so the claim banner disappears after the next rebuild.
  if (member) existingFm.memberstack_id = member.id;

  const markdown = buildVendorMarkdown(fields, existingFm);
  const commitMsg = `Update vendor profile: ${fields['business-name'] || vendorSlug}`;
  const result = await commitFile(filePath, markdown, commitMsg);

  if (result.status >= 400) {
    throw new Error(`GitHub commit failed: ${JSON.stringify(result.data)}`);
  }

  await triggerRebuild();

  // Sync all key fields to Memberstack custom fields so the account page
  // displays current data and the profile form pre-fills correctly.
  if (member) {
    const syncFields = {
      'vendor-slug':   vendorSlug,
      'business-name': fields['business-name'] || '',
      'tagline':       fields['tagline']        || '',
      'category':      fields['category']       || '',
      'city':          fields['city']           || '',
      'phone':         fields['phone']          || '',
      'website':       fields['website']        || '',
      'instagram':     fields['instagram']      || '',
      'facebook':      fields['facebook']       || '',
      'hero-image':    fields['hero-image']     || '',
    };
    // Remove empty strings so we don't blank out existing values
    Object.keys(syncFields).forEach(k => { if (!syncFields[k]) delete syncFields[k]; });
    syncFields['vendor-slug'] = vendorSlug; // always write slug
    const msResult = await memberstackRequest('PATCH', `/members/${member.id}`, { customFields: syncFields });
    if (msResult.status >= 400) {
      console.error('[paperform] Memberstack PATCH failed:', msResult.status, JSON.stringify(msResult.data));
    } else {
      console.log('[paperform] Memberstack custom fields synced for member:', member.id);
    }
  } else {
    console.warn('[paperform] No Memberstack member found for email:', email, '— skipping custom field sync');
  }

  return { message: 'Profile updated', vendor: vendorSlug };
}

// ─── Memberstack handler ──────────────────────────────────────────────────────

async function handleMemberstack(body) {
  const event = typeof body === 'string' ? JSON.parse(body) : body;
  const type = event.type;

  // Memberstack sends test/ping events with no member payload — return 200 so
  // the dashboard doesn't mark the webhook as failed.
  const member = (event.data && event.data.member) || event.member || null;
  if (!member) {
    console.log('[memberstack] no member payload — event type:', type);
    return { message: 'No member data; skipping', type };
  }

  const cf = member.customFields || {};
  let vendorSlug = cf['vendor-slug'];

  // Fallback: if vendor-slug not yet on member (paid before filling the form),
  // search GitHub for a vendor file matching this member's email.
  if (!vendorSlug) {
    const email = member.auth && member.auth.email;
    vendorSlug = await findVendorSlugByEmail(email);
    if (vendorSlug) {
      // Stamp it so future webhooks don't need the search fallback.
      await setMemberVendorSlug(member.id, vendorSlug);
    }
  }

  if (!vendorSlug) {
    // Member without a vendor slug and no matching file — nothing to sync.
    return { message: 'No vendor-slug on member and no matching file; skipping', type };
  }

  const filePath = `_vendors/${vendorSlug}.md`;

  // Read existing file
  const existing = await githubRequest('GET',
    `/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${filePath}?ref=${process.env.GITHUB_BRANCH || 'main'}`
  );

  let existingFm = {};
  let existingBody = '';
  if (existing.status === 200) {
    const decoded = Buffer.from(existing.data.content, 'base64').toString('utf8');
    existingFm = parseFrontmatter(decoded);
    existingBody = extractBody(decoded);
  }

  // Plan IDs that represent a paid subscription
  const PAID_PLAN_IDS = [
    process.env.MEMBERSTACK_LISTED_PLAN_ID,
    process.env.MEMBERSTACK_FEATURED_PLAN_ID,
  ].filter(Boolean);

  const cancelTypes = ['member.plan.removed', 'member.deleted'];

  if (type === 'member.created') {
    // Just stamp the memberstack_id so the claim banner goes away.
    // Do NOT set is_subscribed — this is a new account, potentially free tier.
    existingFm.memberstack_id = member.id;
    // If they somehow already have a paid plan on creation (unlikely), honour it.
    const planConnections = member.planConnections || [];
    const hasPaid = PAID_PLAN_IDS.length > 0 && planConnections.some(p => PAID_PLAN_IDS.includes(p.planId));
    if (hasPaid) {
      existingFm.is_subscribed = true;
      existingFm.is_featured = planConnections.some(p => p.planId === process.env.MEMBERSTACK_FEATURED_PLAN_ID);
    }
  } else if (type === 'member.plan.added' || type === 'member.updated') {
    existingFm.memberstack_id = member.id;
    const planConnections = member.planConnections || [];
    const hasPaid = PAID_PLAN_IDS.length > 0 && planConnections.some(p => PAID_PLAN_IDS.includes(p.planId));
    existingFm.is_subscribed = hasPaid;
    existingFm.is_featured = planConnections.some(p => p.planId === process.env.MEMBERSTACK_FEATURED_PLAN_ID);
  } else if (cancelTypes.includes(type)) {
    existingFm.is_subscribed = false;
    existingFm.is_featured = false;
  } else {
    return { message: `Unhandled event type: ${type}; skipping` };
  }

  // Rebuild the file
  const markdown = buildVendorMarkdown(cf, Object.assign({}, existingFm, { _body: existingBody }));
  const action = existingFm.is_subscribed ? 'Activate' : 'Deactivate';
  const result = await commitFile(filePath, markdown, `${action} vendor listing: ${vendorSlug}`);

  if (result.status >= 400) {
    throw new Error(`GitHub commit failed: ${JSON.stringify(result.data)}`);
  }

  await triggerRebuild();
  return { message: `Vendor ${action.toLowerCase()}d`, vendor: vendorSlug, type };
}

// ─── Minimal front-matter parser (no dependencies) ───────────────────────────

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let inArray = false;

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*?):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim().replace(/^"|"$/g, '');
      if (val === 'true') fm[currentKey] = true;
      else if (val === 'false') fm[currentKey] = false;
      else if (val === '') { fm[currentKey] = []; inArray = true; }
      else { fm[currentKey] = val; inArray = false; }
    } else if (inArray && line.match(/^\s+-\s+/)) {
      const item = line.replace(/^\s+-\s+"?/, '').replace(/"$/, '');
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      fm[currentKey].push(item);
    }
  }
  return fm;
}

function extractBody(markdown) {
  const match = markdown.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : '';
}

// ─── Lambda handler ───────────────────────────────────────────────────────────

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Validate required env vars before doing any work
  const missing = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'].filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error('[webhook] Missing env vars:', missing.join(', '));
    return { statusCode: 500, body: JSON.stringify({ error: `Missing environment variables: ${missing.join(', ')}` }) };
  }

  const source = (event.queryStringParameters || {}).source;

  try {
    let result;
    if (source === 'paperform') {
      result = await handlePaperform(event.body);
    } else if (source === 'memberstack') {
      result = await handleMemberstack(event.body);
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown source. Use ?source=paperform or ?source=memberstack' }) };
    }
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error('[webhook error]', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
