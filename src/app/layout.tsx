import "@/styles/globals.css";

import { type Metadata } from "next";
import localFont from "next/font/local";

import { TRPCReactProvider } from "@/trpc/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const bricolage = localFont({
  src: "../../public/fonts/BricolageGrotesque.ttf",
  variable: "--font-heading",
  display: "swap",
});

const figtree = localFont({
  src: "../../public/fonts/Figtree.ttf",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lume — The checkout that grows your business",
  description: "One checkout button for restaurants, services, and merchants. Lume powers ecommerce flows that convert.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(figtree.variable, bricolage.variable, "font-sans")}>
      <body>
        <TRPCReactProvider><TooltipProvider>{children}</TooltipProvider></TRPCReactProvider>
      </body>
    </html>
  );
}
