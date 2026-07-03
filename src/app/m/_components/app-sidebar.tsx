"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreateBusinessDialog } from "@/app/m/_components/create-business-dialog";
import { useBusinesses } from "@/app/m/_components/business-provider";
import {
  CaretDown,
  ChartBar,
  Gear,
  Globe,
  Headset,
  Plugs,
  ShareNetwork,
  UsersThree,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { BUSINESS_ROUTES, VERTICAL_CONFIG, type BusinessType } from "@/verticals/types";

const PRIMARY_NAV = [
  { href: "/m/dashboard", label: "Dashboard", Icon: ChartBar },
  { href: "/m/share", label: "Share", Icon: ShareNetwork },
  { href: "/m/connect", label: "Connect", Icon: Plugs, restaurantOnly: true },
] as const;

const PRIMITIVE_NAV = [
  { id: "presence", label: "Presence", Icon: Globe, route: "dynamic" },
  { id: "ownership", label: "Ownership", Icon: UsersThree, href: "/m/ownership" },
  { id: "support", label: "Support", Icon: Headset, href: "/m/support" },
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
  comingSoon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill" }>;
  active: boolean;
  onNavigate: () => void;
  comingSoon?: boolean;
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
          <span className="flex flex-1 items-center justify-between gap-2">
            {label}
            {comingSoon ? (
              <span className="rounded-full bg-[#f5f5f5] px-1.5 py-0.5 text-[0.625rem] font-medium text-neutral-500">
                Soon
              </span>
            ) : null}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { activeBusiness, businesses, setActiveBusiness } = useBusinesses();

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-10 min-w-0 flex-1 items-center justify-between rounded-lg border border-[#ebebeb] bg-white px-3 text-sm font-medium text-neutral-900"
              >
                <span className="truncate">
                  {activeBusiness?.name ?? "Select business"}
                </span>
                <CaretDown size={14} className="shrink-0 text-neutral-400" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {businesses.length > 0 ? (
                businesses.map((business) => (
                  <DropdownMenuItem
                    key={business.id}
                    onClick={() => void setActiveBusiness(business.id)}
                  >
                    <span className="truncate">{business.name}</span>
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-neutral-400 capitalize">
                      {business.groupId ? (
                        <span className="rounded-full bg-[#ede9fe] px-1.5 py-0.5 text-[0.625rem] font-medium text-[#6366f1]">
                          Group
                        </span>
                      ) : null}
                      {business.type}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No businesses yet</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateBusinessDialog />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {PRIMARY_NAV.filter(
                (item) =>
                  !("restaurantOnly" in item && item.restaurantOnly) ||
                  activeBusiness?.type === "restaurant",
              ).map(({ href, label, Icon }) => (
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
              {PRIMITIVE_NAV.map((item) => {
                const VERTICAL_PATHS = Object.values(BUSINESS_ROUTES);
                const presenceActive = item.id === "presence" && VERTICAL_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));

                if (item.id === "presence") {
                  const presenceHref = activeBusiness ? BUSINESS_ROUTES[activeBusiness.type as BusinessType] : "/m/dashboard";
                  return (
                    <NavLink
                      key="presence"
                      href={presenceHref}
                      label={item.label}
                      Icon={item.Icon}
                      active={presenceActive}
                      onNavigate={closeOnNavigate}
                    />
                  );
                }

                return (
                  <NavLink
                    key={item.id}
                    href={"href" in item ? item.href : "/m/dashboard"}
                    label={item.label}
                    Icon={item.Icon}
                    active={pathname === ("href" in item ? item.href : "") || pathname.startsWith(("href" in item ? item.href : "") + "/")}
                    onNavigate={closeOnNavigate}
                  />
                );
              })}
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
