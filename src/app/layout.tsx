import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Public_Sans } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

const publicSans = Public_Sans({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Lume — The checkout that grows your business",
  description: "One checkout button for restaurants, services, and merchants. Lume powers ecommerce flows that convert.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(geist.variable, "font-sans", publicSans.variable, geistHeading.variable)}>
      <body>
        <TRPCReactProvider><TooltipProvider>{children}</TooltipProvider></TRPCReactProvider>
      </body>
    </html>
  );
}
