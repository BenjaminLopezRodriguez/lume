import "@/styles/globals.css";

import { type Metadata } from "next";
import { Bricolage_Grotesque, Figtree, Space_Grotesk } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
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
    <html lang="en" className={cn(figtree.variable, bricolage.variable, spaceGrotesk.variable, "font-sans")}>
      <body>
        <TRPCReactProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
