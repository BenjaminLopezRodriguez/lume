import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Lightning,
  LockSimple,
  ShoppingCart,
  CheckCircle,
  ForkKnife,
  Briefcase,
  Storefront,
  Star,
  ArrowUpRight,
} from "@phosphor-icons/react/dist/ssr";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fafaf8" }}>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <BottomCTA />
      <Footer />
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900/10 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Lightning size={16} weight="fill" className="text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Lume</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {["Features", "Merchants", "Pricing", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/10">
            Log in
          </Button>
          <Button size="sm" className="gap-1.5">
            Get started <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-6 pb-0 pt-24 lg:pt-32">
      {/* dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: `28px 28px`,
        }}
      />
      {/* purple glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-violet-600/20 blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* eyebrow */}
        <div className="mb-8 flex items-center gap-2 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-violet-300">
            <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" aria-hidden />
            Now processing $500M+ annually
          </span>
        </div>

        <div className="grid items-end gap-16 lg:grid-cols-2">
          {/* copy */}
          <div className="flex flex-col gap-8 pb-24">
            <h1 className="text-6xl font-extrabold leading-[1.05] tracking-tighter text-white lg:text-[5.5rem]">
              Every checkout.
              <br />
              <span className="text-violet-400">Fully yours.</span>
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-zinc-400">
              Lume powers ecommerce flows for restaurants, service businesses, and
              merchants — all through one checkout button your customers actually finish.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2 px-8 text-base">
                Start for free <ArrowRight size={16} />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="gap-1.5 px-8 text-base text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                See a demo <ArrowUpRight size={15} />
              </Button>
            </div>

            {/* inline trust */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
              {[
                "10,000+ active merchants",
                "99.9% uptime SLA",
                "No setup fees",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle size={13} weight="fill" className="text-violet-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* checkout mockup — bleeds into next section */}
          <div className="relative flex justify-center pb-0 lg:justify-end">
            {/* glow behind card */}
            <div
              aria-hidden
              className="absolute inset-x-8 top-8 h-full rounded-t-2xl bg-violet-600/25 blur-2xl"
            />

            <div className="relative w-full max-w-sm overflow-hidden rounded-t-2xl border border-white/10 shadow-2xl shadow-black/60">
              {/* chrome */}
              <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <div className="flex gap-1.5" aria-hidden>
                  <div className="size-3 rounded-full bg-zinc-600" />
                  <div className="size-3 rounded-full bg-zinc-600" />
                  <div className="size-3 rounded-full bg-zinc-600" />
                </div>
                <div className="mx-auto flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                  <LockSimple size={9} />
                  lume.io/checkout
                </div>
              </div>

              {/* card body */}
              <div className="bg-white p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Your Order</h3>
                  <ShoppingCart size={18} className="text-gray-400" aria-hidden />
                </div>

                <div className="mb-5 space-y-3">
                  {[
                    { name: "Grilled Salmon Bowl", price: "$18.00" },
                    { name: "Oat Milk Latte", price: "$6.00" },
                    { name: "Sparkling Water", price: "$3.00" },
                  ].map((item) => (
                    <div key={item.name} className="flex justify-between text-sm">
                      <span className="text-gray-500">{item.name}</span>
                      <span className="font-medium text-gray-900">{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-5 space-y-1.5 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span><span>$27.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Tax</span><span>$2.16</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span><span>$29.16</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <LockSimple size={13} weight="fill" />
                  Checkout securely
                  <ArrowRight size={13} />
                </button>

                <p className="mt-3 text-center text-xs text-gray-400">
                  Powered by Lume · 256-bit encryption
                </p>
              </div>
            </div>

            {/* floating notification */}
            <div
              aria-hidden
              className="absolute right-4 top-20 hidden rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-medium text-white shadow-xl lg:block"
            >
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-green-400" />
              +$29.16 confirmed
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="px-6 py-24" style={{ backgroundColor: "#fafaf8" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Built for every business
        </div>
        <div className="mb-16 flex items-end justify-between gap-8">
          <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl">
            Restaurants. Services.
            <br />
            Merchants. All covered.
          </h2>
          <p className="hidden max-w-sm text-base leading-relaxed text-zinc-500 lg:block">
            Whether you serve tables, book clients, or sell products — Lume's
            checkout adapts to your flow, not the other way around.
          </p>
        </div>

        {/* bento grid */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "2fr 1fr", gridTemplateRows: "auto auto" }}
        >
          {/* Restaurants — wide, top left */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8">
            <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-orange-50">
              <ForkKnife size={20} weight="fill" className="text-orange-500" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-zinc-900">Restaurants</h3>
            <p className="mb-6 text-zinc-500">
              Table-side, takeout, delivery — one checkout flow your guests already
              know how to finish.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Menu & modifier management",
                "Table QR codes",
                "Delivery integrations",
                "Real-time kitchen tickets",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle size={13} weight="fill" className="shrink-0 text-primary" aria-hidden />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Services — tall, spans both rows */}
          <div
            className="rounded-2xl border border-zinc-200 bg-zinc-950 p-8 text-white"
            style={{ gridRow: "span 2" }}
          >
            <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-white/10">
              <Briefcase size={20} weight="fill" className="text-violet-300" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Services</h3>
            <p className="mb-8 text-zinc-400">
              Haircuts to home repairs. Let clients book and pay in one step — no
              invoice chasing, no back-and-forth.
            </p>
            <ul className="space-y-3">
              {[
                "Appointment scheduling",
                "Deposits & full payment",
                "Recurring billing",
                "Service packages",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle size={13} weight="fill" className="shrink-0 text-violet-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-1 text-3xl font-black tabular-nums text-white">
                2.1s
              </div>
              <div className="text-xs text-zinc-400">
                Average time from cart to confirmation
              </div>
            </div>
          </div>

          {/* Merchants — wide, bottom left */}
          <div className="rounded-2xl border border-zinc-200 bg-violet-50 p-8">
            <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-white">
              <Storefront size={20} weight="fill" className="text-violet-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-zinc-900">Merchants</h3>
            <p className="mb-6 text-zinc-600">
              Physical or digital — give every customer the fastest checkout
              they've ever used, across all your locations.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Inventory sync",
                "Multi-location support",
                "Discount & promo codes",
                "Analytics dashboard",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle size={13} weight="fill" className="shrink-0 text-violet-600" aria-hidden />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    title: "Add Lume to your site",
    desc: "One line of code or use our no-code builder. Takes minutes.",
  },
  {
    n: "02",
    title: "Customers browse & select",
    desc: "Your menu, services, or products — beautiful on any device.",
  },
  {
    n: "03",
    title: "One tap to pay",
    desc: "Apple Pay, Google Pay, card. Done before they change their mind.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-zinc-950 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            How it works
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
            Live in an afternoon.
          </h2>
        </div>

        <div className="grid gap-0 lg:grid-cols-3">
          {STEPS.map(({ n, title, desc }, i) => (
            <div
              key={n}
              className="relative border-zinc-800 py-10 lg:border-l lg:px-10 first:lg:border-l-0 first:lg:pl-0"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full border border-zinc-700 text-xs font-bold text-zinc-400">
                  {i + 1}
                </span>
                <div className="h-px flex-1 bg-zinc-800 lg:hidden" aria-hidden />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
              <p className="leading-relaxed text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section className="px-6 py-24" style={{ backgroundColor: "#fafaf8" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          From the merchants
        </div>
        <h2 className="mb-16 text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl">
          They switched. They stayed.
        </h2>

        <div className="grid gap-4">
          {/* featured quote — full width, dark */}
          <figure className="rounded-2xl bg-zinc-950 p-10 text-white lg:p-14">
            <div className="mb-6 flex gap-0.5" aria-label="5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} weight="fill" className="text-yellow-400" aria-hidden />
              ))}
            </div>
            <blockquote className="mb-8 max-w-3xl text-2xl font-medium leading-relaxed text-white lg:text-3xl">
              &ldquo;Lume cut our checkout abandonment in half. Our regulars tap
              once and they&rsquo;re done — they don&rsquo;t even think about it.
              That&rsquo;s the product you want.&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                MR
              </div>
              <div>
                <p className="font-semibold text-white">Maria R.</p>
                <p className="text-sm text-zinc-400">Owner, The Rosemary Bistro</p>
              </div>
            </figcaption>
          </figure>

          {/* two smaller */}
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              {
                quote:
                  "Went from a clunky POS to Lume in an afternoon. Revenue was up 22% the next week. I wish I'd done it sooner.",
                author: "James K.",
                role: "Founder, Swift Services",
                initials: "JK",
              },
              {
                quote:
                  "Three locations, one dashboard. Lume is the backbone of how we operate now. Can't imagine going back.",
                author: "Priya S.",
                role: "Director, Urban Market",
                initials: "PS",
              },
            ].map(({ quote, author, role, initials }) => (
              <figure
                key={author}
                className="rounded-2xl border border-zinc-200 bg-white p-8"
              >
                <div className="mb-4 flex gap-0.5" aria-label="5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} weight="fill" className="text-yellow-400" aria-hidden />
                  ))}
                </div>
                <blockquote className="mb-6 leading-relaxed text-zinc-700">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{author}</p>
                    <p className="text-xs text-zinc-400">{role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCTA() {
  return (
    <section className="relative overflow-hidden bg-primary px-6 py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: `24px 24px`,
        }}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-white lg:text-6xl">
          Start selling smarter today
        </h2>
        <p className="text-xl text-primary-foreground/70">
          No setup fees. No long-term contracts. Just a checkout that works.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            className="gap-2 bg-white px-8 text-base text-primary hover:bg-white/90"
          >
            Get started free <ArrowRight size={16} />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="px-8 text-base text-white hover:bg-white/10"
          >
            Talk to sales
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_LINKS: Record<string, string[]> = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Merchants: ["Restaurants", "Services", "Retail", "Case studies"],
  Resources: ["Docs", "API Reference", "Status", "Blog"],
  Company: ["About", "Careers", "Privacy", "Terms"],
};

function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary">
                <Lightning size={13} weight="fill" className="text-primary-foreground" aria-hidden />
              </div>
              <span className="font-bold text-zinc-900">Lume</span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">
              The checkout button for every business.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 text-sm font-semibold text-zinc-900">{section}</h4>
              <ul className="space-y-2.5" role="list">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-zinc-400 transition-colors hover:text-zinc-700">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-zinc-100 pt-8 sm:flex-row">
          <p className="text-sm text-zinc-400">© 2026 Lume, Inc. All rights reserved.</p>
          <p className="text-sm text-zinc-400">Made with commerce in mind.</p>
        </div>
      </div>
    </footer>
  );
}
