import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "6353: REBUILT | FRC Team 6353 Engineering Portfolio",
  description: "A Decade of Mechanical Evolution. Born in 2016 as 9036, forged in 2017 as 6353. Based in No.2 High School of East China Normal University, Shanghai.",
  keywords: ["FRC", "6353", "Robotics", "Engineering", "Portfolio", "EFZ"],
  authors: [{ name: "FRC Team 6353" }],
  openGraph: {
    title: "6353: REBUILT",
    description: "Violent Aesthetics Engineering Portfolio - FRC Team 6353",
    type: "website",
    url: "https://efz-robotics-2026.lol",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script: drives the preloader entirely via DOM.
            This ensures the overlay fades out even if React hydration
            is slow or the dev-server HMR connection drops. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  function boot() {
    var el = document.getElementById('__preloader');
    if (!el) return;

    window.__LOAD = { progress: 0, done: false };
    var total = 1, loaded = 0;
    var pctEl = document.getElementById('__load-pct');
    var barEl = document.getElementById('__load-bar');
    var barBottom = document.getElementById('__load-bar-bottom');

    function calc() {
      var p = total > 0 ? Math.min(98, Math.round((loaded / total) * 100)) : 0;
      window.__LOAD.progress = p;
      if (pctEl) pctEl.textContent = p;
      if (barEl) barEl.style.width = p + '%';
      if (barBottom) barBottom.style.width = p + '%';
    }

    var perf = performance.getEntriesByType('resource');
    loaded = perf.length;
    total = Math.max(1, loaded + 8);
    calc();

    if (window.PerformanceObserver) {
      try {
        var obs = new PerformanceObserver(function(list) {
          loaded += list.getEntries().length;
          calc();
        });
        obs.observe({ entryTypes: ['resource'] });
      } catch(e) {}
    }

    loaded += 3; calc();

    function finish() {
      if (window.__LOAD.done) return;
      window.__LOAD.progress = 100;
      window.__LOAD.done = true;
      if (pctEl) pctEl.textContent = '100';
      if (barEl) barEl.style.width = '100%';
      if (barBottom) barBottom.style.width = '100%';
      setTimeout(function() {
        el.style.transition = 'opacity 0.6s ease';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        setTimeout(function() {
          el.style.display = 'none';
        }, 700);
      }, 300);
    }

    window.addEventListener('load', finish);
    setTimeout(finish, 6000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
