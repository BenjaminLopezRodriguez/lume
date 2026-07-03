import { Toaster } from "sonner";
import { MobileShell } from "@/app/m/_components/mobile-shell";

export default function MobileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <MobileShell>{children}</MobileShell>
      <Toaster position="bottom-center" />
    </>
  );
}
