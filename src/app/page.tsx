import { Landing } from "@/app/_components/landing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.onlume.co";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "Lume",
      url: APP_URL,
      description:
        "One checkout for restaurants, services, and retail. Live in minutes, built to convert.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${APP_URL}/#software`,
      name: "Lume",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Checkout and order management for restaurants with delivery platform integrations.",
      provider: { "@id": `${APP_URL}/#organization` },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(homeJsonLd)}</script>
      <Landing />
    </>
  );
}
