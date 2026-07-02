"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Lightning,
  LockSimple,
  ShoppingCart,
  CheckCircle,
  Star,
  ForkKnife,
  Briefcase,
  Storefront,
  Globe,
  MagnifyingGlass,
  Package,
  CalendarCheck,
} from "@phosphor-icons/react/dist/ssr";

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: "Designed for your business",
    desc: "Every checkout flow is tailored to your category — no generic forms, no guesswork. Restaurants, salons, shops, and services all get the layout that fits how they sell.",
  },
  {
    title: "Accepted everywhere",
    desc: "Apple Pay, Google Pay, card, and link — one integration covers every payment method that matters. No extra setup. No extra fees.",
  },
  {
    title: "Built to convert",
    desc: "Smart autofill, one-tap repeat checkout, and sub-2-second load times cut abandonment before it starts. Your checkout doesn't lose sales your business earned.",
  },
  {
    title: "Clear and transparent",
    desc: "Subtotals, taxes, and fees in full view before the pay button. No surprise total at confirmation. Trust converts — and keeps them coming back.",
  },
  {
    title: "Always supported",
    desc: "Live chat, onboarding help, and a team that knows your business type. When something goes wrong — and it will — you're not alone with a help doc.",
  },
];

const OFFERINGS = [
  {
    name: "Restaurants",
    desc: "Table ordering, QR codes, kitchen sync, and tipping — built for the pace of service.",
  },
  {
    name: "Services",
    desc: "From haircuts to home repairs — clients book, confirm, and pay without the back-and-forth.",
  },
  {
    name: "Merchants",
    desc: "Link-based checkout, in-store POS replacement, and inventory sync in one button.",
  },
  {
    name: "Developers",
    desc: "A clean API, webhooks, and embeddable components. Wire Lume anywhere in hours, not days.",
  },
];

const SELL_METHODS = [
  { Icon: ForkKnife, label: "At the table", bg: "#fff0e8", fg: "#e85d04", desc: "QR codes, table ordering, kitchen sync" },
  { Icon: Briefcase, label: "Book a service", bg: "#e8f0ff", fg: "#2d5be3", desc: "Scheduling, deposits, recurring billing" },
  { Icon: Storefront, label: "In-store", bg: "#eafaf1", fg: "#1a7a4a", desc: "POS replacement, tap to pay, inventory" },
  { Icon: Globe, label: "Online", bg: "#f3e8ff", fg: "#7c3aed", desc: "Embed checkout anywhere, any device" },
];

const SHOPPER_PERKS = [
  { Icon: CheckCircle, text: "Saved payment info everywhere — pay once, never re-enter again." },
  { Icon: Star, text: "Verified reviews from real customers at every Lume business." },
  { Icon: Package, text: "Live order and booking status for everything in one feed." },
  { Icon: CalendarCheck, text: "Book, order, and buy from any Lume seller in seconds." },
];

const SHOP_LISTINGS = [
  { name: "Rosemary Bistro", tag: "Restaurant · 0.3 mi", rating: "4.9", color: "#3d2a1a" },
  { name: "Luxe Cuts Studio", tag: "Hair salon · Now open", rating: "4.8", color: "#1a2a3d" },
  { name: "Mesa Home Goods", tag: "Merchant · Ships today", rating: "4.7", color: "#1a3d2a" },
];

const REVIEWS = [
  {
    name: "Maria R.",
    initials: "MR",
    text: "Lume cut our checkout abandonment in half. Our regulars tap once and they're done. That's the product you want.",
    when: "2 weeks ago",
    featured: false,
  },
  {
    name: "James K.",
    initials: "JK",
    text: "We went from a clunky POS to Lume in an afternoon. Revenue was up 22% the next week. I wish I'd done it sooner.",
    when: "1 month ago",
    featured: true,
  },
  {
    name: "Priya S.",
    initials: "PS",
    text: "Three locations, one dashboard. Lume is the backbone of how we operate. Can't imagine going back.",
    when: "3 weeks ago",
    featured: false,
  },
];

const FOOTER_LINKS: Record<string, string[]> = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Merchants: ["Restaurants", "Services", "Retail", "Case studies"],
  Resources: ["Docs", "API Reference", "Status", "Blog"],
  Company: ["About", "Careers", "Privacy", "Terms"],
};

// ── Root ──────────────────────────────────────────────────────────────────────

export function Landing() {
  return (
    <div className="min-h-screen bg-white" style={{ color: "var(--landing-fg)" }}>
      <TopBar />
      <Nav />
      <Hero />
      <StatsStrip />
      <FeatureScroll />
      <Offering />
      <HowYouSell />
      <LumeShop />
      <Testimonials />
      <BottomCTA />
      <Footer />
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div className="flex items-center justify-center gap-8 border-b border-gray-100 py-2 text-sm" style={{ color: "var(--landing-muted)" }}>
      <a href="#" className="font-medium transition-opacity hover:opacity-60" style={{ color: "var(--landing-fg)" }}>
        For merchants
      </a>
      <a href="#" className="transition-opacity hover:opacity-60">For shoppers</a>
      <a href="#" className="transition-opacity hover:opacity-60">For developers</a>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-gradient-to-b from-white/85 via-white/65 to-white/40 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-black tracking-tight">Lume</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {["Features", "Merchants", "Lume Shop", "Pricing", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="text-sm font-medium transition-opacity hover:opacity-60"
              style={{ color: "var(--landing-fg)" }}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-sm font-medium [touch-action:manipulation]"
            style={{ color: "var(--landing-fg)" }}
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="btn-spring rounded-full px-6 py-2 text-sm font-semibold text-white [touch-action:manipulation] focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: "var(--landing-fg)" }}
          >
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white px-6 pt-20 pb-0">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* copy */}
        <div className="flex flex-col gap-8 pb-20">
          <h1
            className="text-6xl font-black leading-[1.05] tracking-tight lg:text-[5.5rem]"
            style={{ color: "var(--landing-fg)", textWrap: "balance" } as React.CSSProperties}
          >
            Your checkout.
            <br />
            <span style={{ color: "var(--landing-accent-deep)" }}>Done right.</span>
          </h1>
          <div className="flex items-center gap-4">
            <button
              className="btn-spring flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white [touch-action:manipulation] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: "var(--landing-accent-deep)",
                outlineColor: "var(--landing-accent-deep)",
              }}
            >
              Get started free <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </div>

        {/* mockup */}
        <div className="relative flex justify-end pb-0">
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-t-3xl shadow-[0_32px_80px_rgba(0,0,0,0.12)]"
            style={{ border: "1px solid var(--landing-border)" }}
          >
            {/* browser chrome */}
            <div className="flex items-center gap-3 border-b bg-gray-50 px-4 py-3" style={{ borderColor: "var(--landing-border)" }}>
              <div className="flex gap-1.5" aria-hidden>
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
              </div>
              <div
                className="mx-auto flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs"
                style={{ borderColor: "var(--landing-border)", color: "var(--landing-muted)" }}
              >
                <LockSimple size={9} aria-hidden />
                lume.io/checkout
              </div>
            </div>
            {/* checkout card */}
            <div className="bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: "var(--landing-fg)" }}>Your Order</h3>
                <ShoppingCart size={18} style={{ color: "var(--landing-muted)" }} aria-hidden />
              </div>
              <div className="mb-5 space-y-3">
                {[
                  { name: "Grilled Salmon Bowl", price: "$18.00" },
                  { name: "Oat Milk Latte", price: "$6.00" },
                  { name: "Sparkling Water", price: "$3.00" },
                ].map((item) => (
                  <div key={item.name} className="flex justify-between text-sm">
                    <span style={{ color: "var(--landing-muted)" }}>{item.name}</span>
                    <span className="font-medium tabular-nums" style={{ color: "var(--landing-fg)" }}>
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mb-5 space-y-1.5 border-t pt-4" style={{ borderColor: "var(--landing-border)" }}>
                <div className="flex justify-between text-sm tabular-nums" style={{ color: "var(--landing-muted)" }}>
                  <span>Subtotal</span><span>$27.00</span>
                </div>
                <div className="flex justify-between text-sm tabular-nums" style={{ color: "var(--landing-muted)" }}>
                  <span>Tax</span><span>$2.16</span>
                </div>
                <div className="flex justify-between font-semibold tabular-nums" style={{ color: "var(--landing-fg)" }}>
                  <span>Total</span><span>$29.16</span>
                </div>
              </div>
              <button
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white [touch-action:manipulation] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: "var(--landing-accent-deep)",
                  outlineColor: "var(--landing-accent-deep)",
                }}
              >
                <LockSimple size={13} weight="fill" aria-hidden />
                Checkout securely
                <ArrowRight size={13} aria-hidden />
              </button>
              <p className="mt-3 text-center text-xs" style={{ color: "var(--landing-muted)" }}>
                Powered by Lume · 256-bit encryption
              </p>
            </div>
          </div>

          {/* floating confirmation chip */}
          <div
            aria-hidden
            className="absolute left-0 top-16 hidden rounded-full px-4 py-2 text-sm font-semibold shadow-lg lg:flex lg:items-center lg:gap-2"
            style={{ backgroundColor: "var(--landing-accent-deep)", color: "white" }}
          >
            <span className="inline-block size-2 rounded-full bg-white/60" />
            +$29.16 confirmed
          </div>
        </div>
      </div>
    </section>
  );
}
// ─── Marquee Strip ────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  "10,000+ merchants",
  "★ 4.8 average rating",
  "$500M+ processed",
  "1.8s avg. checkout",
  "Apple Pay",
  "Google Pay",
  "Visa · Mastercard · Amex",
  "Rosemary Bistro · $29.16 ✓",
  "Luxe Cuts Studio · $142.00 ✓",
  "Mesa Home Goods · $67.50 ✓",
  "Zero setup fees",
  "Live in minutes",
];

function StatsStrip() {
  return (
    <section
      className="overflow-hidden border-y py-2"
      style={{
        backgroundColor: "var(--landing-fg)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
      aria-hidden
    >
      <Marquee pauseOnHover className="[--duration:28s] [--gap:0px] p-0">
        {MARQUEE_ITEMS.map((item) => (
          <span
            key={item}
            className="inline-flex shrink-0 items-center gap-4 px-8 text-sm font-semibold"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {item}
            <span
              className="inline-block size-1 rounded-full"
              style={{ backgroundColor: "var(--landing-accent-deep)" }}
            />
          </span>
        ))}
      </Marquee>
    </section>
  );
}

// ─── Feature Scroll ───────────────────────────────────────────────────────────

const NAV_HEIGHT = 64; // matches header h-16

function FeatureCheckoutMockup() {
  return (
    <div
      className="overflow-hidden rounded-3xl"
      style={{ backgroundColor: "var(--landing-bg)", border: "1px solid var(--landing-border)" }}
    >
      <div className="p-8">
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--landing-accent-deep)" }}
          >
            <Lightning size={20} weight="fill" className="text-white" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--landing-fg)" }}>Lume Checkout</div>
            <div className="text-xs" style={{ color: "var(--landing-muted)" }}>Rosemary Bistro</div>
          </div>
        </div>
        <div className="mb-6 space-y-3">
          {[
            { name: "Salmon Bowl", qty: "×1", price: "$18" },
            { name: "Oat Latte", qty: "×2", price: "$12" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white p-4">
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--landing-fg)" }}>{item.name}</div>
                <div className="text-xs" style={{ color: "var(--landing-muted)" }}>{item.qty}</div>
              </div>
              <div className="font-semibold tabular-nums" style={{ color: "var(--landing-fg)" }}>{item.price}</div>
            </div>
          ))}
        </div>
        <button
          className="w-full rounded-full py-4 text-sm font-bold text-white [touch-action:manipulation]"
          style={{ backgroundColor: "var(--landing-fg)" }}
        >
          Pay $30.00
        </button>
        <div className="mt-4 flex justify-center gap-4">
          {["Apple Pay", "Google Pay", "Card"].map((m) => (
            <span key={m} className="text-xs font-medium" style={{ color: "var(--landing-muted)" }}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Grab the inner card divs (not the sticky wrappers)
    const cards = Array.from(
      container.querySelectorAll<HTMLElement>("[data-feature-inner]")
    );
    const n = cards.length;

    const update = () => {
      const scrolled = Math.max(0, -container.getBoundingClientRect().top);
      const slotH = window.innerHeight;

      cards.forEach((el, i) => {
        if (i === n - 1) return; // last card never exits
        // p: 0 when this card's slot starts, 1 when it ends
        const p = Math.max(0, Math.min(1, (scrolled - i * slotH) / slotH));
        // scale toward center + slight rise; opacity fades after halfway
        el.style.transform = `scale(${(1 - p * 0.06).toFixed(4)})`;
        el.style.opacity = Math.max(0, 1 - p * 1.5).toFixed(4);
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <h2
          className="mb-16 text-4xl font-black lg:text-5xl"
          style={{ color: "var(--landing-fg)", textWrap: "balance" } as React.CSSProperties}
        >
          Your everyday checkout platform
        </h2>

        {/* Each card owns one viewport-height of scroll runway */}
        <div
          ref={containerRef}
          style={{ height: `calc(${FEATURES.length * 100}vh + 6rem)` }}
        >
          {FEATURES.map(({ title, desc }, i) => (
            <div
              key={title}
              className="sticky"
              style={{ top: NAV_HEIGHT, zIndex: i + 1 }}
            >
              <div
                data-feature-inner
                className="grid items-center gap-12 rounded-3xl border bg-white p-8 shadow-[0_-8px_40px_rgba(0,0,0,0.06)] lg:grid-cols-2 lg:gap-16 lg:p-12"
                style={{
                  borderColor: "var(--landing-border)",
                  transformOrigin: "top center",
                  willChange: "transform, opacity",
                }}
              >
                <div className="flex flex-col gap-6">
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "var(--landing-muted)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className="text-3xl font-black lg:text-4xl"
                    style={{ color: "var(--landing-fg)", textWrap: "balance" } as React.CSSProperties}
                  >
                    {title}
                  </h3>
                  <p className="max-w-md text-base leading-relaxed" style={{ color: "var(--landing-muted)" }}>
                    {desc}
                  </p>
                </div>
                <FeatureCheckoutMockup />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
// ─── Offering ─────────────────────────────────────────────────────────────────

function Offering() {
  const [active, setActive] = useState(1);
  const current = OFFERINGS[active]!;

  return (
    <section className="border-t border-gray-100 px-6 py-24" style={{ backgroundColor: "var(--landing-surface)" }}>
      <div className="mx-auto max-w-5xl">
        <p className="mb-16 text-center text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--landing-muted)" }}>
          Explore our solutions
        </p>

        <div className="flex flex-col items-center gap-2">
          {OFFERINGS.map(({ name }, i) => (
            <div key={name} className="w-full text-center">
              <button
                onClick={() => setActive(i)}
                className="w-full cursor-pointer [touch-action:manipulation] focus-visible:outline-2 focus-visible:outline-offset-4"
                style={{ outlineColor: "var(--landing-accent-deep)" }}
                aria-pressed={i === active}
              >
                <h3
                  className="cursor-pointer text-6xl font-black transition-colors lg:text-8xl"
                  style={{ color: i === active ? "var(--landing-fg)" : "var(--landing-border)" }}
                >
                  {name}
                </h3>
              </button>
              {i === active && (
                <div
                  className="mx-auto mb-4 mt-4 max-w-md"
                  style={{ animation: "spring-fade-in 200ms ease both" }}
                >
                  <p className="mb-4 text-base leading-relaxed" style={{ color: "var(--landing-muted)" }}>
                    {current.desc}
                  </p>
                  <button
                    className="btn-spring rounded-full px-6 py-2.5 text-sm font-semibold text-white [touch-action:manipulation] focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      backgroundColor: "var(--landing-fg)",
                      outlineColor: "var(--landing-fg)",
                    }}
                  >
                    Learn more
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How You Sell ─────────────────────────────────────────────────────────────

function HowYouSell() {
  return (
    <section className="border-t border-gray-100 bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <h2
          className="mb-4 text-center text-4xl font-black lg:text-5xl"
          style={{ color: "var(--landing-fg)", textWrap: "balance" } as React.CSSProperties}
        >
          Pick how you sell
        </h2>
        <p className="mb-16 text-center text-lg" style={{ color: "var(--landing-muted)" }}>
          One checkout button. Every commerce type.
        </p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SELL_METHODS.map(({ Icon, label, bg, fg, desc }) => (
            <div
              key={label}
              className="group flex flex-col gap-5 overflow-hidden rounded-3xl p-7 transition-transform hover:-translate-y-1"
              style={{ backgroundColor: bg }}
            >
              <div
                className="flex size-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${fg}20` }}
              >
                <Icon size={24} weight="fill" style={{ color: fg }} aria-hidden />
              </div>
              <div>
                <div className="mb-1 text-lg font-black" style={{ color: "var(--landing-fg)" }}>{label}</div>
                <div className="text-sm leading-relaxed" style={{ color: "var(--landing-muted)" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
// ─── Lume Shop ────────────────────────────────────────────────────────────────

function LumeShop() {
  return (
    <section className="overflow-hidden px-6 py-24" style={{ backgroundColor: "var(--landing-fg)" }}>
      <div className="mx-auto grid max-w-7xl items-center gap-20 lg:grid-cols-2">
        {/* copy */}
        <div className="flex flex-col gap-8">
          <div>
            <span
              className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: "var(--landing-accent-deep)", color: "white" }}
            >
              Lume Shop
            </span>
          </div>

          <h2
            className="text-5xl font-black leading-[1.05] tracking-tight text-white lg:text-6xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            One app.<br />Every seller.
          </h2>

          <p className="max-w-md text-lg leading-relaxed" style={{ color: "#9e9693" }}>
            Thousands of restaurants, service businesses, and merchants —
            all on one marketplace. Discover local favorites, book what you need,
            and check out in seconds with your saved info.
          </p>

          <ul className="flex flex-col gap-4">
            {SHOPPER_PERKS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon
                  size={18}
                  weight="fill"
                  style={{ color: "var(--landing-accent-deep)" }}
                  className="mt-0.5 shrink-0"
                  aria-hidden
                />
                <span className="text-sm leading-relaxed" style={{ color: "#c4bfbe" }}>{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4">
            <button
              className="btn-spring flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white [touch-action:manipulation] hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ backgroundColor: "var(--landing-accent-deep)" }}
            >
              Download the app <ArrowRight size={16} aria-hidden />
            </button>
            <button
              className="btn-spring text-sm font-semibold underline underline-offset-4 [touch-action:manipulation] hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ color: "#9e9693" }}
            >
              Browse Lume Shop
            </button>
          </div>
        </div>

        {/* phone mockup */}
        <div className="relative flex justify-center lg:justify-end">
          <div
            className="relative w-64 overflow-hidden rounded-[2.5rem] shadow-2xl"
            style={{ backgroundColor: "#1c1512", border: "1px solid #2e2520" }}
          >
            <div className="flex justify-center pb-1 pt-3" aria-hidden>
              <div className="h-5 w-24 rounded-full" style={{ backgroundColor: "#2e2520" }} />
            </div>

            <div className="px-4 pb-8">
              <div className="mb-4 flex items-center justify-between py-2">
                <span className="text-base font-black text-white">Lume Shop</span>
                <div
                  className="flex size-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--landing-accent-deep)" }}
                >
                  <Lightning size={13} weight="fill" className="text-white" aria-hidden />
                </div>
              </div>

              <div
                className="mb-4 flex items-center gap-2 rounded-2xl px-3 py-2.5"
                style={{ backgroundColor: "#2e2520" }}
              >
                <MagnifyingGlass size={12} style={{ color: "#6b5f5a" }} aria-hidden />
                <span className="text-xs" style={{ color: "#6b5f5a" }}>Restaurants, services, shops…</span>
              </div>

              <div className="mb-4 flex gap-2">
                {["All", "Food", "Services", "Shop"].map((cat, i) => (
                  <span
                    key={cat}
                    className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{
                      backgroundColor: i === 0 ? "var(--landing-accent-deep)" : "#2e2520",
                      color: i === 0 ? "white" : "#9e9693",
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                {SHOP_LISTINGS.map(({ name, tag, rating, color }) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-2xl p-3"
                    style={{ backgroundColor: "#2e2520" }}
                  >
                    <div className="size-10 shrink-0 rounded-xl" style={{ backgroundColor: color }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">{name}</div>
                      <div className="truncate text-xs" style={{ color: "#6b5f5a" }}>{tag}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Star size={10} weight="fill" style={{ color: "#fbbf24" }} aria-hidden />
                      <span className="text-xs font-semibold tabular-nums" style={{ color: "#9e9693" }}>{rating}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-4 flex justify-around border-t pt-3"
                style={{ borderColor: "#2e2520" }}
                aria-hidden
              >
                {["Home", "Explore", "Orders", "You"].map((tab, i) => (
                  <div key={tab} className="flex flex-col items-center gap-0.5">
                    <div
                      className="size-4 rounded"
                      style={{ backgroundColor: i === 0 ? "var(--landing-accent-deep)" : "#3d3028" }}
                    />
                    <span className="text-[10px]" style={{ color: i === 0 ? "var(--landing-accent-deep)" : "#6b5f5a" }}>
                      {tab}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="absolute -left-6 top-16 hidden rounded-2xl px-4 py-3 shadow-xl lg:block"
            style={{ backgroundColor: "#2e2520", border: "1px solid #3d3028" }}
          >
            <div className="text-xs font-semibold text-white">Order placed</div>
            <div className="mt-0.5 text-xs" style={{ color: "#9e9693" }}>Rosemary Bistro · $29.16</div>
          </div>

          <div
            aria-hidden
            className="absolute -right-6 bottom-20 hidden rounded-2xl px-4 py-3 shadow-xl lg:block"
            style={{ backgroundColor: "var(--landing-accent-deep)" }}
          >
            <div className="text-xs font-bold text-white">Booking confirmed</div>
            <div className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>Luxe Cuts · 3:00 PM today</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section className="border-t border-gray-100 px-6 py-24" style={{ backgroundColor: "var(--landing-surface)" }}>
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--landing-muted)" }}>
          Reviews
        </p>
        <h2
          className="mb-12 text-center text-4xl font-black lg:text-5xl"
          style={{ color: "var(--landing-fg)", textWrap: "balance" } as React.CSSProperties}
        >
          4.8 stars from real merchants
        </h2>

        <div className="grid gap-4 lg:grid-cols-3">
          {REVIEWS.map(({ name, initials, text, when, featured }) => (
            <figure
              key={name}
              className="flex flex-col gap-5 rounded-3xl p-8 transition-transform"
              style={{
                backgroundColor: featured ? "var(--landing-fg)" : "white",
                color: featured ? "white" : "var(--landing-fg)",
                transform: featured ? "scale(1.03)" : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: featured ? "var(--landing-accent-deep)" : "var(--landing-surface)",
                    color: featured ? "white" : "var(--landing-fg)",
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{name}</div>
                  <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} weight="fill" style={{ color: "#fbbf24" }} aria-hidden />
                    ))}
                  </div>
                </div>
              </div>

              <blockquote
                className="flex-1 text-base leading-relaxed"
                style={{ color: featured ? "#e5e5e5" : "var(--landing-muted)" }}
              >
                &ldquo;{text}&rdquo;
              </blockquote>

              <figcaption className="text-xs" style={{ color: featured ? "#9e9693" : "#aaa" }}>
                {when}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCTA() {
  return (
    <section className="px-6 py-32" style={{ backgroundColor: "var(--landing-accent-deep)" }}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <h2
          className="text-4xl font-black text-white lg:text-6xl"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          Start selling smarter today
        </h2>
        <p className="text-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
          No setup fees. No long-term contracts. Just a checkout that works.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            className="btn-spring flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold [touch-action:manipulation] hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ backgroundColor: "var(--landing-fg)", color: "white" }}
          >
            Get started free <ArrowRight size={16} aria-hidden />
          </button>
          <button
            className="btn-spring rounded-full border border-white/30 px-8 py-4 text-base font-bold text-white [touch-action:manipulation] hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Talk to sales
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div
                className="flex size-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--landing-accent-deep)" }}
              >
                <Lightning size={13} weight="fill" className="text-white" aria-hidden />
              </div>
              <span className="text-lg font-black" style={{ color: "var(--landing-fg)" }}>Lume</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--landing-muted)" }}>
              The checkout button for every business.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 text-sm font-bold" style={{ color: "var(--landing-fg)" }}>{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm transition-opacity hover:opacity-100"
                      style={{ color: "var(--landing-muted)" }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-12 flex flex-col justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row"
        >
          <p className="text-sm" style={{ color: "var(--landing-muted)" }}>© 2026 Lume, Inc. All rights reserved.</p>
          <p className="text-sm" style={{ color: "var(--landing-muted)" }}>Made with commerce in mind.</p>
        </div>
      </div>
    </footer>
  );
}
