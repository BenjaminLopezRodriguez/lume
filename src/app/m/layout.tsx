import { Toaster } from "sonner";
import { MobileShell } from "@/app/m/_components/mobile-shell";
import {
  AskLumeProvider,
  AskLumeSurface,
} from "@/app/m/_components/ask-lume-provider";

export default function MobileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <MobileShell>
        <AskLumeProvider>
          {children}
          <AskLumeSurface />
        </AskLumeProvider>
      </MobileShell>
      <Toaster position="bottom-center" />
    </>
  );
}
