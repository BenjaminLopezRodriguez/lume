import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@phosphor-icons/react/dist/ssr";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <LogoBar />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <BottomCTA />
      <Footer />
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Lightning size={16} weight="fill" className="text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Lume</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {["Features", "Merchants", "Pricing", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
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
    <section className="relative overflow-hidden bg-white px-6 py-24 lg:py-32">
      {/* bg blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 -z-10 h-[640px] w-[640px] -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/5"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* copy */}
        <div className="flex flex-col gap-8">
          <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs">
            <Lightning size={11} weight="fill" />
            Trusted by 10,000+ merchants
          </Badge>

          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-gray-900 lg:text-[4.5rem]">
            The checkout that&nbsp;grows your business
          </h1>

          <p className="text-xl leading-relaxed text-gray-500">
            One button. Every business. Lume gives restaurants, services, and
            merchants a seamless checkout their customers actually finish.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="gap-2 px-8 text-base">
              Start for free <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="outline" className="px-8 text-base">
              See a demo
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
            {[
              "No credit card required",
              "Free 14-day trial",
              "Cancel anytime",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle size={13} weight="fill" className="text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* checkout mockup */}
        <CheckoutMockup />
      </div>
    </section>
  );
}

function CheckoutMockup() {
  return (
    <div className="relative flex justify-center lg:justify-end">
      {/* browser shell */}
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/60">
        {/* chrome bar */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <div className="size-3 rounded-full bg-red-400" />
            <div className="size-3 rounded-full bg-yellow-400" />
            <div className="size-3 rounded-full bg-green-400" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-400">
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
              <span>Subtotal</span>
              <span>$27.00</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tax</span>
              <span>$2.16</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>$29.16</span>
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

      {/* floating badges */}
      <div
        aria-hidden
        className="absolute -left-4 top-8 hidden rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-lg lg:flex lg:items-center lg:gap-2"
      >
        <span className="text-green-500">✓</span> Payment confirmed
      </div>
      <div
        aria-hidden
        className="absolute -right-4 bottom-16 hidden rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-lg lg:block"
      >
        +$29 <span className="text-gray-400">just now</span>
      </div>
    </div>
  );
}

// ─── Logo Bar ─────────────────────────────────────────────────────────────────

const BRANDS = [
  "Rosemary Bistro",
  "Swift Services",
  "The Corner Store",
  "Coastal Eats",
  "Pro Clean Co.",
  "Urban Market",
];

function LogoBar() {
  return (
    <section className="border-y border-gray-100 bg-gray-50/60 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          Trusted by businesses across the country
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {BRANDS.map((b) => (
            <span key={b} className="text-sm font-bold text-gray-300 lg:text-base">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: ForkKnife,
    title: "Restaurants",
    description:
      "Table-side ordering, takeout, delivery — all through one checkout flow your guests already know.",
    items: [
      "Menu & modifier management",
      "Table QR codes",
      "Delivery integrations",
      "Real-time kitchen tickets",
    ],
    accent: "bg-orange-50 text-orange-500",
  },
  {
    Icon: Briefcase,
    title: "Services",
    description:
      "From haircuts to home repairs, let clients book and pay in one seamless step.",
    items: [
      "Appointment scheduling",
      "Deposits & full payment",
      "Recurring billing",
      "Service packages",
    ],
    accent: "bg-blue-50 text-blue-500",
  },
  {
    Icon: Storefront,
    title: "Merchants",
    description:
      "Physical or digital — give every customer the fastest checkout they've ever used.",
    items: [
      "Inventory sync",
      "Multi-location support",
      "Discount & promo codes",
      "Analytics dashboard",
    ],
    accent: "bg-violet-50 text-violet-500",
  },
] as const;

function Features() {
  return (
    <section id="features" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <Badge variant="secondary" className="mb-4">
            Built for every business
          </Badge>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 lg:text-5xl">
            One platform. Every commerce type.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
            Whether you serve tables, clients, or customers, Lume's checkout
            adapts to your flow — not the other way around.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, description, items, accent }) => (
            <div
              key={title}
              className="flex flex-col gap-6 rounded-2xl border border-gray-100 bg-gray-50/40 p-8 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                className={`flex size-12 items-center justify-center rounded-xl ${accent}`}
                aria-hidden
              >
                <Icon size={24} weight="fill" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
                <p className="leading-relaxed text-gray-500">{description}</p>
              </div>
              <ul className="space-y-2.5" role="list">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle
                      size={14}
                      weight="fill"
                      className="shrink-0 text-primary"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
    desc: "Drop in one line of code or use our no-code builder. Set up takes minutes, not days.",
  },
  {
    n: "02",
    title: "Customers browse & select",
    desc: "Your menu, services, or products — presented beautifully on any device, any screen size.",
  },
  {
    n: "03",
    title: "One tap to pay",
    desc: "Apple Pay, Google Pay, card — the fastest checkout your customers have ever experienced.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-900 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <Badge className="mb-4 border-0 bg-white/10 text-white hover:bg-white/15">
            How it works
          </Badge>
          <h2 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
            Up and running in minutes
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="flex flex-col gap-4">
              <span
                className="text-7xl font-black leading-none text-white/10"
                aria-hidden
              >
                {n}
              </span>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="leading-relaxed text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "10K+", label: "Active merchants" },
  { value: "$500M+", label: "Processed annually" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "1.8s", label: "Avg. checkout time" },
];

function Stats() {
  return (
    <section className="border-y border-gray-100 bg-white px-6 py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 lg:grid-cols-4">
        {STATS.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <span className="text-4xl font-black tracking-tight text-gray-900 lg:text-5xl">
              {value}
            </span>
            <span className="text-sm text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote:
      "Lume cut our checkout abandonment in half. Our regulars tap once and they're done — they don't even think about it.",
    author: "Maria R.",
    role: "Owner, The Rosemary Bistro",
  },
  {
    quote:
      "We went from a clunky POS to Lume in an afternoon. Revenue was up 22% the next week. I wish I'd done it sooner.",
    author: "James K.",
    role: "Founder, Swift Services",
  },
  {
    quote:
      "Three locations, one dashboard. Lume is the backbone of how we operate now. Can't imagine going back.",
    author: "Priya S.",
    role: "Director, Urban Market",
  },
];

function Testimonials() {
  return (
    <section className="bg-gray-50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 lg:text-5xl">
            Merchants love Lume
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map(({ quote, author, role }) => (
            <figure
              key={author}
              className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
            >
              <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    weight="fill"
                    className="text-yellow-400"
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="flex-1 leading-relaxed text-gray-700">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <figcaption className="border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-900">{author}</p>
                <p className="text-sm text-gray-400">{role}</p>
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
    <section className="bg-primary px-6 py-32">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-white lg:text-6xl">
          Start selling smarter today
        </h2>
        <p className="text-xl text-primary-foreground/70">
          Join 10,000+ businesses that run on Lume. No setup fees. No
          long-term contracts.
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
    <footer className="border-t border-gray-100 bg-white px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary">
                <Lightning
                  size={13}
                  weight="fill"
                  className="text-primary-foreground"
                  aria-hidden
                />
              </div>
              <span className="font-bold">Lume</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              The checkout button for every business.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 text-sm font-semibold text-gray-900">
                {section}
              </h4>
              <ul className="space-y-2.5" role="list">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 transition-colors hover:text-gray-700"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
          <p className="text-sm text-gray-400">
            © 2026 Lume, Inc. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">Made with commerce in mind.</p>
        </div>
      </div>
    </footer>
  );
}
