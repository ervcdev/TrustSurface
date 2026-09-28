import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import { DataFreshness } from "@/components/data-freshness";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trust Surface",
  description:
    "Evidence, not a verdict, for tokenized real-world assets. Five independent signals per asset — backed by the raw CoinMarketCap API call behind each one.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header
              className="sticky top-0 z-50"
              style={{
                background: "var(--surface-0)",
                borderBottom: "1px solid var(--surface-3)",
              }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-12">
                  <Link
                    href="/"
                    className="text-base"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--ink-primary)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Trust Surface
                  </Link>
                  <nav className="hidden sm:flex items-center gap-6">
                    {[
                      { href: "/", label: "Explore" },
                      { href: "/compare", label: "Compare" },
                      { href: "/methodology", label: "Methodology" },
                    ].map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className="text-sm hover:opacity-100 transition-opacity"
                        style={{
                          fontFamily: "var(--font-sans)",
                          color: "var(--ink-secondary)",
                          opacity: 0.8,
                        }}
                      >
                        {label}
                      </Link>
                    ))}
                  </nav>
                  <ThemeToggle />
                </div>
                {/* Freshness bar */}
                <div
                  className="py-1.5"
                  style={{ borderTop: "1px solid var(--surface-2)" }}
                >
                  <DataFreshness />
                </div>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
              {children}
            </main>

            {/* Footer */}
            <footer
              className="py-4"
              style={{ borderTop: "1px solid var(--surface-3)" }}
            >
              <div
                className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between"
              >
                <span
                  className="text-xs font-mono"
                  style={{ color: "var(--ink-tertiary)" }}
                >
                  Built for{" "}
                  <a
                    href="https://dorahacks.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Build with CMC: API Hackathon
                  </a>{" "}
                  · Real World Assets track
                </span>
                <a
                  href="/methodology"
                  className="text-xs font-mono underline"
                  style={{ color: "var(--ink-tertiary)" }}
                >
                  Methodology
                </a>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
