"use client";

// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Presence nav, capabilities from listForBusiness (not CAPABILITY_SETS by type).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CreateBusinessDialog } from "@/app/m/_components/create-business-dialog";
import { useBusinesses } from "@/app/m/_components/business-provider";
import {
  CaretDown,
  Gear,
  Globe,
  Headset,
  House,
  LinkSimple,
  Plugs,
  QrCode,
  Receipt,
  Robot,
  Tag,
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Store",
    items: [
      { label: "Home", Icon: House, href: "/m/dashboard" },
      { label: "Orders", Icon: Receipt, href: "/m/orders" },
      { label: "Products", Icon: Tag, href: "/m/store" },
      { label: "Customers", Icon: UsersThree, href: "/m/ownership" },
    ],
  },
  {
    label: "Sales channels",
    items: [
      { label: "Online store", Icon: Globe, href: "/m/presence/web" },
      { label: "Payment links", Icon: LinkSimple, href: "/m/presence/link" },
      { label: "QR codes", Icon: QrCode, href: "/m/presence/qr" },
    ],
  },
  {
    label: "Automate",
    items: [{ label: "Agents", Icon: Robot, href: "/m/agents" }],
  },
] as const;

const FOOTER_NAV = [
  { href: "/m/connect", label: "Integrations", Icon: Plugs },
  { href: "/m/settings", label: "Settings", Icon: Gear },
  { href: "/m/support", label: "Support", Icon: Headset },
] as const;

const ITEM_CLASS = cn(
  "motion-control h-11 rounded-lg px-3 text-sm font-normal text-muted-foreground md:h-10",
  "hover:bg-sidebar-accent/50 hover:text-foreground",
  "data-[active=true]:bg-sidebar-accent/60 data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground",
  "data-[active=true]:hover:bg-sidebar-accent/60 data-[active=true]:hover:text-sidebar-accent-foreground",
);

const GROUP_LABEL_CLASS =
  "px-3 text-[0.6875rem] font-medium tracking-wider text-muted-foreground/60 uppercase";

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
      <SidebarMenuButton asChild isActive={active} className={ITEM_CLASS}>
        <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined}>
          <Icon size={18} weight={active ? "fill" : "regular"} />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { activeBusiness, businesses, setActiveBusiness } = useBusinesses();

  function closeOnNavigate() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border bg-card text-foreground"
    >
      <SidebarHeader className="gap-4 px-4 pt-6 pb-2">
        <Link
          href="/m/dashboard"
          onClick={closeOnNavigate}
          className="px-2 text-xl font-bold tracking-tight text-foreground"
        >
          Lume
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="motion-control flex h-10 min-w-0 flex-1 items-center justify-between rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground"
              >
                <span className="truncate">
                  {activeBusiness?.name ?? "Select business"}
                </span>
                <CaretDown size={14} className="shrink-0 text-muted-foreground/70" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {businesses.length > 0 ? (
                businesses.map((business) => (
                  <DropdownMenuItem
                    key={business.id}
                    onClick={async () => {
                      await setActiveBusiness(business.id);
                      router.push("/m/dashboard");
                    }}
                  >
                    <span className="truncate">{business.name}</span>
                    {business.groupId ? (
                      <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[0.625rem] font-medium text-accent-foreground">
                        Group
                      </span>
                    ) : null}
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
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            <SidebarGroupLabel className={GROUP_LABEL_CLASS}>
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    Icon={item.Icon}
                    active={
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                    }
                    onNavigate={closeOnNavigate}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarSeparator className="mx-2 my-3 bg-border" />

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {FOOTER_NAV.map(({ href, label, Icon }) => (
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
