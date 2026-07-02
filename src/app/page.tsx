import { Button } from "@/components/ui/button";
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

const DARK = "#17120e";
const PINK = "#ff5bae";
const GRAY = "#6b6b6b";
const LIGHT = "#f5f5f5";

export default function Home() {
  return (
    <div className="min-h-screen bg-white" style={{ color: DARK, fontFamily: "var(--font-sans, system-ui)" }}>
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
    <div className="flex items-center justify-center gap-8 border-b border-gray-100 py-2 text-sm" style={{ color: GRAY }}>
      <a href="#" className="font-medium transition-colors hover:text-black" style={{ color: DARK }}>
        For merchants
      </a>
      <a href="#" className="transition-colors hover:text-black">
        For shoppers
      </a>
      <a href="#" className="transition-colors hover:text-black">
        For developers
      </a>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: PINK }}>
            <Lightning size={16} weight="fill" className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tight">Lume</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {["Features", "Merchants", "Lume Shop", "Pricing", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium transition-colors hover:opacity-60"
              style={{ color: DARK }}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-sm font-medium"
            style={{ color: DARK }}
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="rounded-full px-5 text-sm font-semibold text-white"
            style={{ backgroundColor: DARK }}
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
            style={{ color: DARK }}
          >
            Your checkout.
            <br />
            Done right.
          </h1>
          <p className="max-w-md text-lg leading-relaxed" style={{ color: GRAY }}>
            Lume powers fast, beautiful checkout flows for restaurants, service
            businesses, and merchants — one button that actually converts.
          </p>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-85"
              style={{ backgroundColor: PINK }}
            >
              Get started free <ArrowRight size={16} />
            </button>
            <button
              className="text-base font-semibold underline underline-offset-4 transition-opacity hover:opacity-60"
              style={{ color: DARK }}
            >
              See a demo
            </button>
          </div>
        </div>

        {/* mockup — bleeds off bottom */}
        <div className="relative flex justify-end pb-0">
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-t-3xl shadow-2xl"
            style={{ border: "1px solid #e5e5e5" }}
          >
            {/* chrome */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex gap-1.5" aria-hidden>
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs" style={{ color: GRAY }}>
                <LockSimple size={9} />
                lume.io/checkout
              </div>
            </div>
            {/* card */}
            <div className="bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: DARK }}>Your Order</h3>
                <ShoppingCart size={18} style={{ color: GRAY }} aria-hidden />
              </div>
              <div className="mb-5 space-y-3">
                {[
                  { name: "Grilled Salmon Bowl", price: "$18.00" },
                  { name: "Oat Milk Latte", price: "$6.00" },
                  { name: "Sparkling Water", price: "$3.00" },
                ].map((item) => (
                  <div key={item.name} className="flex justify-between text-sm">
                    <span style={{ color: GRAY }}>{item.name}</span>
                    <span className="font-medium" style={{ color: DARK }}>{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="mb-5 space-y-1.5 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm" style={{ color: GRAY }}>
                  <span>Subtotal</span><span>$27.00</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: GRAY }}>
                  <span>Tax</span><span>$2.16</span>
                </div>
                <div className="flex justify-between font-semibold" style={{ color: DARK }}>
                  <span>Total</span><span>$29.16</span>
                </div>
              </div>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 focus-visible:outline-none"
                style={{ backgroundColor: PINK }}
              >
                <LockSimple size={13} weight="fill" />
                Checkout securely
                <ArrowRight size={13} />
              </button>
              <p className="mt-3 text-center text-xs" style={{ color: GRAY }}>
                Powered by Lume · 256-bit encryption
              </p>
            </div>
          </div>

          {/* floating notification */}
          <div
            aria-hidden
            className="absolute left-0 top-16 hidden rounded-full px-4 py-2 text-sm font-semibold shadow-lg lg:flex lg:items-center lg:gap-2"
            style={{ backgroundColor: DARK, color: "white" }}
          >
            <span className="inline-block size-2 rounded-full bg-green-400" />
            +$29.16 confirmed
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────

function StatsStrip() {
  return (
    <section className="border-b border-gray-100 px-6 py-12">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2">
        <h2 className="text-3xl font-black lg:text-4xl" style={{ color: DARK }}>
          Trusted by{" "}
          <span
            className="relative inline-block"
            style={{ color: DARK }}
          >
            <span
              className="relative z-10"
              style={{
                backgroundImage: `linear-gradient(transparent 65%, ${PINK}55 65%)`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
              }}
            >
              thousands
            </span>
          </span>{" "}
          of businesses
        </h2>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {[
            { value: "10K+", label: "Active merchants" },
            { value: "4.8★", label: "Average rating" },
            { value: "$500M+", label: "Processed" },
            { value: "1.8s", label: "Avg. checkout" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-black lg:text-3xl" style={{ color: DARK }}>
                {value}
              </div>
              <div className="mt-1 text-sm" style={{ color: GRAY }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Feature Scroll ───────────────────────────────────────────────────────────

const FEATURES = [
  { title: "Designed for your business", desc: "Every checkout flow is tailored to your category — no generic forms, no guesswork." },
  { title: "Accepted everywhere" },
  { title: "Built to convert" },
  { title: "Clear and transparent" },
  { title: "Always supported" },
];

function FeatureScroll() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
          The Lume experience
        </p>
        <h2 className="mb-16 text-4xl font-black lg:text-5xl" style={{ color: DARK }}>
          Your everyday checkout platform
        </h2>

        <div className="grid items-start gap-16 lg:grid-cols-2">
          {/* left: static mockup */}
          <div className="lg:sticky lg:top-24">
            <div
              className="overflow-hidden rounded-3xl"
              style={{ backgroundColor: LIGHT }}
            >
              <div className="p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full" style={{ backgroundColor: PINK }}>
                    <Lightning size={20} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: DARK }}>Lume Checkout</div>
                    <div className="text-xs" style={{ color: GRAY }}>Rosemary Bistro</div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { name: "Salmon Bowl", qty: "×1", price: "$18" },
                    { name: "Oat Latte", qty: "×2", price: "$12" },
                  ].map(item => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white p-4">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: DARK }}>{item.name}</div>
                        <div className="text-xs" style={{ color: GRAY }}>{item.qty}</div>
                      </div>
                      <div className="font-semibold" style={{ color: DARK }}>{item.price}</div>
                    </div>
                  ))}
                </div>
                <button
                  className="w-full rounded-full py-4 text-sm font-bold text-white"
                  style={{ backgroundColor: DARK }}
                >
                  Pay $30.00
                </button>
                <div className="mt-4 flex justify-center gap-4">
                  {["Apple Pay", "Google Pay", "Card"].map(m => (
                    <span key={m} className="text-xs font-medium" style={{ color: GRAY }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* right: feature accordion */}
          <div className="flex flex-col">
            {FEATURES.map(({ title, desc }, i) => (
              <div
                key={title}
                className="border-t border-gray-100 py-8"
              >
                <h3
                  className="text-3xl font-black lg:text-4xl transition-colors"
                  style={{ color: i === 0 ? DARK : "#d1d1d1" }}
                >
                  {title}
                </h3>
                {i === 0 && desc && (
                  <p className="mt-3 max-w-sm text-base leading-relaxed" style={{ color: GRAY }}>
                    {desc}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Offering ─────────────────────────────────────────────────────────────────

const OFFERINGS = [
  { name: "Restaurants", active: false },
  { name: "Services", active: true, desc: "From haircuts to home repairs — clients book, confirm, and pay without the back-and-forth." },
  { name: "Merchants", active: false },
  { name: "Developers", active: false },
];

function Offering() {
  return (
    <section className="border-t border-gray-100 px-6 py-24" style={{ backgroundColor: LIGHT }}>
      <div className="mx-auto max-w-5xl">
        <p className="mb-16 text-center text-sm font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
          Explore our solutions
        </p>

        <div className="flex flex-col items-center gap-2">
          {OFFERINGS.map(({ name, active, desc }) => (
            <div key={name} className="w-full text-center">
              <h3
                className="cursor-pointer text-6xl font-black transition-colors lg:text-8xl"
                style={{ color: active ? DARK : "#d1d1d1" }}
              >
                {name}
              </h3>
              {active && desc && (
                <div className="mx-auto mb-4 mt-4 max-w-md">
                  <p className="mb-4 text-base leading-relaxed" style={{ color: GRAY }}>{desc}</p>
                  <button
                    className="rounded-full px-6 py-2.5 text-sm font-semibold text-white"
                    style={{ backgroundColor: DARK }}
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

const SELL_METHODS = [
  {
    Icon: ForkKnife,
    label: "At the table",
    bg: "#fff0e8",
    fg: "#e85d04",
    desc: "QR codes, table ordering, kitchen sync",
  },
  {
    Icon: Briefcase,
    label: "Book a service",
    bg: "#e8f0ff",
    fg: "#2d5be3",
    desc: "Scheduling, deposits, recurring billing",
  },
  {
    Icon: Storefront,
    label: "In-store",
    bg: "#eafaf1",
    fg: "#1a7a4a",
    desc: "POS replacement, tap to pay, inventory",
  },
  {
    Icon: Globe,
    label: "Online",
    bg: "#f3e8ff",
    fg: "#7c3aed",
    desc: "Embed checkout anywhere, any device",
  },
];

function HowYouSell() {
  return (
    <section className="border-t border-gray-100 px-6 py-24 bg-white">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-4 text-4xl font-black text-center lg:text-5xl" style={{ color: DARK }}>
          Pick how you sell
        </h2>
        <p className="mb-16 text-center text-lg" style={{ color: GRAY }}>
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
                style={{ backgroundColor: fg + "20" }}
              >
                <Icon size={24} weight="fill" style={{ color: fg }} aria-hidden />
              </div>
              <div>
                <div className="mb-1 text-lg font-black" style={{ color: DARK }}>{label}</div>
                <div className="text-sm leading-relaxed" style={{ color: GRAY }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Lume Shop ────────────────────────────────────────────────────────────────

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

function LumeShop() {
  return (
    <section className="overflow-hidden px-6 py-24" style={{ backgroundColor: DARK }}>
      <div className="mx-auto grid max-w-7xl items-center gap-20 lg:grid-cols-2">

        {/* copy */}
        <div className="flex flex-col gap-8">
          <div>
            <span
              className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: PINK, color: "white" }}
            >
              Lume Shop
            </span>
          </div>

          <h2 className="text-5xl font-black leading-[1.05] tracking-tight text-white lg:text-6xl">
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
                <Icon size={18} weight="fill" style={{ color: PINK }} className="mt-0.5 shrink-0" aria-hidden />
                <span className="text-sm leading-relaxed" style={{ color: "#c4bfbe" }}>{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4">
            <button
              className="flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-85"
              style={{ backgroundColor: PINK }}
            >
              Download the app <ArrowRight size={16} />
            </button>
            <button
              className="text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-60"
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
            {/* notch */}
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-5 w-24 rounded-full" style={{ backgroundColor: "#2e2520" }} />
            </div>

            <div className="px-4 pb-8">
              {/* header */}
              <div className="mb-4 flex items-center justify-between py-2">
                <span className="text-base font-black text-white">Lume Shop</span>
                <div
                  className="flex size-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: PINK }}
                >
                  <Lightning size={13} weight="fill" className="text-white" aria-hidden />
                </div>
              </div>

              {/* search */}
              <div
                className="mb-4 flex items-center gap-2 rounded-2xl px-3 py-2.5"
                style={{ backgroundColor: "#2e2520" }}
              >
                <MagnifyingGlass size={12} style={{ color: "#6b5f5a" }} aria-hidden />
                <span className="text-xs" style={{ color: "#6b5f5a" }}>
                  Restaurants, services, shops...
                </span>
              </div>

              {/* category pills */}
              <div className="mb-4 flex gap-2">
                {["All", "Food", "Services", "Shop"].map((cat, i) => (
                  <span
                    key={cat}
                    className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{
                      backgroundColor: i === 0 ? PINK : "#2e2520",
                      color: i === 0 ? "white" : "#9e9693",
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* listings */}
              <div className="space-y-2">
                {SHOP_LISTINGS.map(({ name, tag, rating, color }) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-2xl p-3"
                    style={{ backgroundColor: "#2e2520" }}
                  >
                    <div
                      className="size-10 shrink-0 rounded-xl"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">{name}</div>
                      <div className="truncate text-xs" style={{ color: "#6b5f5a" }}>{tag}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Star size={10} weight="fill" style={{ color: "#fbbf24" }} aria-hidden />
                      <span className="text-xs font-semibold" style={{ color: "#9e9693" }}>{rating}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* bottom nav */}
              <div
                className="mt-4 flex justify-around border-t pt-3"
                style={{ borderColor: "#2e2520" }}
                aria-hidden
              >
                {["Home", "Explore", "Orders", "You"].map((tab, i) => (
                  <div key={tab} className="flex flex-col items-center gap-0.5">
                    <div
                      className="size-4 rounded"
                      style={{ backgroundColor: i === 0 ? PINK : "#3d3028" }}
                    />
                    <span className="text-[10px]" style={{ color: i === 0 ? PINK : "#6b5f5a" }}>
                      {tab}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* floating badges */}
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
            style={{ backgroundColor: PINK }}
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

function Testimonials() {
  return (
    <section className="border-t border-gray-100 px-6 py-24" style={{ backgroundColor: LIGHT }}>
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest" style={{ color: GRAY }}>
          Reviews
        </p>
        <h2 className="mb-12 text-center text-4xl font-black lg:text-5xl" style={{ color: DARK }}>
          4.8 stars from real merchants
        </h2>

        <div className="grid gap-4 lg:grid-cols-3">
          {REVIEWS.map(({ name, initials, text, when, featured }) => (
            <figure
              key={name}
              className="flex flex-col gap-5 rounded-3xl p-8"
              style={{
                backgroundColor: featured ? DARK : "white",
                color: featured ? "white" : DARK,
                transform: featured ? "scale(1.03)" : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: featured ? PINK : LIGHT,
                    color: featured ? "white" : DARK,
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{name}</div>
                  <div className="flex gap-0.5" aria-label="5 stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} weight="fill" style={{ color: "#fbbf24" }} aria-hidden />
                    ))}
                  </div>
                </div>
              </div>

              <blockquote className="flex-1 text-base leading-relaxed" style={{ color: featured ? "#e5e5e5" : GRAY }}>
                &ldquo;{text}&rdquo;
              </blockquote>

              <figcaption className="text-xs" style={{ color: featured ? "#777" : "#aaa" }}>
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
    <section className="px-6 py-32" style={{ backgroundColor: PINK }}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <h2 className="text-4xl font-black text-white lg:text-6xl">
          Start selling smarter today
        </h2>
        <p className="text-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
          No setup fees. No long-term contracts. Just a checkout that works.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            className="flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold transition-opacity hover:opacity-85"
            style={{ backgroundColor: DARK, color: "white" }}
          >
            Get started free <ArrowRight size={16} />
          </button>
          <button
            className="rounded-full border border-white/30 px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-75"
          >
            Talk to sales
          </button>
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
              <div className="flex size-7 items-center justify-center rounded-lg" style={{ backgroundColor: PINK }}>
                <Lightning size={13} weight="fill" className="text-white" aria-hidden />
              </div>
              <span className="font-black text-lg" style={{ color: DARK }}>Lume</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: GRAY }}>
              The checkout button for every business.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 text-sm font-bold" style={{ color: DARK }}>{section}</h4>
              <ul className="space-y-2.5" role="list">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm transition-colors hover:opacity-100"
                      style={{ color: GRAY }}
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
          <p className="text-sm" style={{ color: GRAY }}>© 2026 Lume, Inc. All rights reserved.</p>
          <p className="text-sm" style={{ color: GRAY }}>Made with commerce in mind.</p>
        </div>
      </div>
    </footer>
  );
}
