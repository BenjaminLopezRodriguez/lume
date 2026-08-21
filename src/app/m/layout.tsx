import { Toaster } from "sonner";
import { MobileShell } from "@/app/m/_components/mobile-shell";
import { AskLumeSurface } from "@/app/m/_components/ask-lume-composer";

export default function MobileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <MobileShell>
        {children}
        <AskLumeSurface />
      </MobileShell>
      <Toaster position="bottom-center" />
    </>
  );
}
