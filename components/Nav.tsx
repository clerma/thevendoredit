'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { getNavData } from '@/lib/site';
import { useEffect, useState } from 'react';

interface NavItem {
  title: string;
  url: string;
  dropdown?: Array<{ title: string; url: string }>;
}

export default function Nav() {
  const { isLoaded, isSignedIn } = useUser();
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    // nav data is fetched once client-side to avoid making this a server component
    fetch('/api/nav').then((r) => r.json()).then(setNavItems).catch(() => {});
  }, []);

  return (
    <nav className="tve-nav navbar">
      <div className="container-fluid px-4 px-lg-5 d-flex align-items-center justify-content-between">

        {/* Logo */}
        <Link href="/" className="tve-wordmark">
          <Image src="/assets/img/logo.svg" alt="The Event Edit" width={140} height={40} className="logo-img" priority />
        </Link>

        {/* Mobile toggle */}
        <button className="navbar-toggler d-lg-none" type="button"
          data-bs-toggle="collapse" data-bs-target="#navbarMobile"
          aria-controls="navbarMobile" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"><i className="ti-menu" /></span>
        </button>

        {/* Desktop nav */}
        <div className="d-none d-lg-flex align-items-center">
          <ul className="navbar-nav flex-row align-items-center">
            {navItems.map((item) =>
              item.dropdown ? (
                <li key={item.url} className="nav-item dropdown">
                  <a className="tve-nav-link dropdown-toggle" href={item.url} role="button"
                    data-bs-toggle="dropdown" aria-expanded="false">
                    {item.title}
                  </a>
                  <ul className="dropdown-menu">
                    {item.dropdown.map((sub) => (
                      <li key={sub.url}>
                        <Link className="dropdown-item" href={sub.url}>{sub.title}</Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.url} className="nav-item">
                  <Link className="tve-nav-link" href={item.url}>{item.title}</Link>
                </li>
              )
            )}

            <li className="nav-item">
              <Link className="tve-nav-link ms-2" href="/favorites/" aria-label="Saved items">
                <i className="ti-heart" />
                <span className="nav-favorites-count">0</span>
              </Link>
            </li>

            {/* Auth state — renders correctly server-side via Clerk */}
            {isLoaded && !isSignedIn && (
              <>
                <li className="nav-item ms-2">
                  <Link className="tve-nav-link" href="/sign-in">Login</Link>
                </li>
                <li className="nav-item ms-2">
                  <Link className="tve-pill" href="/list-your-business">List Your Business</Link>
                </li>
              </>
            )}
            {isLoaded && isSignedIn && (
              <>
                <li className="nav-item ms-2">
                  <Link className="tve-nav-link" href="/account">My Account</Link>
                </li>
                <li className="nav-item ms-2">
                  <SignOutButton redirectUrl="/">
                    <button className="tve-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Logout
                    </button>
                  </SignOutButton>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="collapse d-lg-none bg-white w-100" id="navbarMobile">
        <ul className="navbar-nav mx-4 py-3">
          {navItems.map((item) =>
            item.dropdown ? (
              <li key={item.url} className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button"
                  data-bs-toggle="dropdown" aria-expanded="false">
                  {item.title}
                </a>
                <ul className="dropdown-menu">
                  {item.dropdown.map((sub) => (
                    <li key={sub.url}>
                      <Link className="dropdown-item" href={sub.url}>{sub.title}</Link>
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={item.url} className="nav-item">
                <Link className="nav-link" href={item.url}>{item.title}</Link>
              </li>
            )
          )}
          <li className="nav-item">
            <Link className="nav-link" href="/favorites/"><i className="ti-heart" /> Saved Items</Link>
          </li>
          {isLoaded && !isSignedIn && (
            <li className="nav-item mt-2">
              <Link className="tve-pill" href="/list-your-business">Get a Listing</Link>
            </li>
          )}
          {isLoaded && isSignedIn && (
            <>
              <li className="nav-item mt-2">
                <Link className="nav-link" href="/account">My Account</Link>
              </li>
              <li className="nav-item">
                <SignOutButton redirectUrl="/">
                  <button className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Logout
                  </button>
                </SignOutButton>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
