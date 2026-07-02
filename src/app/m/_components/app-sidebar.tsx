"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreateBusinessDialog } from "@/app/m/_components/create-business-dialog";
import { useBusinesses } from "@/app/m/_components/business-provider";
import {
  CalendarStar,
  CaretDown,
  ChartBar,
  ForkKnife,
  Gear,
  ShareNetwork,
  Storefront,
} from "@phosphor-icons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/m/dashboard", label: "Dashboard", Icon: ChartBar },
  { href: "/m/share", label: "Share", Icon: ShareNetwork },
] as const;

const BUSINESS_NAV = [
  { href: "/m/store", label: "Store", Icon: Storefront },
  { href: "/m/restaurant", label: "Restaurant", Icon: ForkKnife },
  { href: "/m/event", label: "Event", Icon: CalendarStar },
] as const;

const SECONDARY_NAV = [
  { href: "/m/settings", label: "Settings", Icon: Gear },
] as const;

function NavLink({
  href,
  label,
  Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill" }>;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        className={cn(
          "h-10 rounded-lg px-3 text-sm font-normal text-neutral-600 hover:bg-[#f5f5f5] hover:text-neutral-900",
          "data-[active=true]:bg-[#e2f1af] data-[active=true]:font-medium data-[active=true]:text-neutral-900",
          "data-[active=true]:hover:bg-[#e2f1af] data-[active=true]:hover:text-neutral-900",
        )}
      >
        <Link href={href} onClick={onNavigate}>
          <Icon size={18} weight={active ? "fill" : "regular"} />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { activeBusiness } = useBusinesses();

  function closeOnNavigate() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-[#ebebeb] bg-white text-neutral-900"
    >
      <SidebarHeader className="gap-4 px-4 pt-6 pb-2">
        <Link
          href="/m/dashboard"
          onClick={closeOnNavigate}
          className="px-2 text-xl font-bold tracking-tight text-neutral-950"
        >
          Lume
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 min-w-0 flex-1 items-center justify-between rounded-lg border border-[#ebebeb] bg-white px-3 text-sm font-medium text-neutral-900"
          >
            <span className="truncate">{activeBusiness?.name ?? "Rosemary Bistro"}</span>
            <CaretDown size={14} className="shrink-0 text-neutral-400" aria-hidden />
          </button>
          <CreateBusinessDialog />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {PRIMARY_NAV.map(({ href, label, Icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  active={pathname === href || pathname.startsWith(`${href}/`)}
                  onNavigate={closeOnNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2 my-3 bg-[#ebebeb]" />

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {BUSINESS_NAV.map(({ href, label, Icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  active={pathname === href || pathname.startsWith(`${href}/`)}
                  onNavigate={closeOnNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2 my-3 bg-[#ebebeb]" />

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {SECONDARY_NAV.map(({ href, label, Icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  active={pathname === href || pathname.startsWith(`${href}/`)}
                  onNavigate={closeOnNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
