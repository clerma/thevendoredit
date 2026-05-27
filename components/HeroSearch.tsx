'use client';

export default function HeroSearch() {
  function goSearch() {
    const q = (document.getElementById('hero-search') as HTMLInputElement)?.value;
    if (q) window.location.href = `/vendors?q=${encodeURIComponent(q)}`;
  }

  return (
    <div className="tve-search">
      <i className="ti-search" style={{ color: 'var(--tve-muted)' }} />
      <input
        id="hero-search"
        placeholder="Search photographers, venues, florists…"
        onKeyDown={(e) => { if (e.key === 'Enter') goSearch(); }}
      />
      <span style={{ width: '1px', height: '20px', background: 'var(--tve-rule)', flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--tve-sans)', fontSize: '13px', color: 'var(--tve-ink-soft)', whiteSpace: 'nowrap' }}>Lafayette, LA</span>
      <button className="tve-search-btn" onClick={goSearch}>Find</button>
    </div>
  );
}
