import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { getSiteData } from '@/lib/site';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Script from 'next/script';

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteData();
  return {
    title: { default: site.name, template: `%s | ${site.name}` },
    description: site.description,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          {/* Fonts */}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600&family=Barlow+Condensed:wght@300;400;500;600&family=Gilda+Display&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap" />
          {/* FontAwesome */}
          <script src="https://kit.fontawesome.com/946c75a861.js" crossOrigin="anonymous" async />
          {/* Bootstrap 5 */}
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
          {/* Owl Carousel */}
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel.min.css" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.theme.default.min.css" />
          {/* Magnific Popup */}
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.1.0/magnific-popup.min.css" />
          {/* Animate.css */}
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
          {/* Theme stylesheets */}
          <link rel="stylesheet" href="/assets/css/style.css" />
          <link rel="stylesheet" href="/assets/css/custom.css" />
          <link rel="stylesheet" href="/assets/css/editorial.css" />
          <link rel="stylesheet" href="/assets/css/plugins/themify-icons.css" />
        </head>
        <body>
          <Nav />
          {children}
          <Footer />

          {/* jQuery (needed by Owl/Magnific) */}
          <Script src="https://code.jquery.com/jquery-3.6.3.min.js" strategy="beforeInteractive" />
          <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
          <Script src="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js" strategy="afterInteractive" />
          <Script src="https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.1.0/jquery.magnific-popup.min.js" strategy="afterInteractive" />
          <Script src="/assets/js/custom.js" strategy="afterInteractive" />
          {/* Paperform embed */}
          <Script src="https://paperform.co/__embed.min.js" strategy="afterInteractive" />
          {/* Nav scroll shadow */}
          <Script id="nav-scroll" strategy="afterInteractive">{`
            (function(){var n=document.querySelector('.tve-nav');if(!n)return;function u(){n.classList.toggle('nav-scrolled',window.scrollY>0);}window.addEventListener('scroll',u,{passive:true});u();})();
          `}</Script>
        </body>
      </html>
    </ClerkProvider>
  );
}
