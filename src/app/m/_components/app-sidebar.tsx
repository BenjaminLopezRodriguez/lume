"use client";

// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Presence nav, capabilities from listForBusiness (not CAPABILITY_SETS by type).
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CreateBusinessDialog } from "@/app/m/_components/create-business-dialog";
import { useBusinesses } from "@/app/m/_components/business-provider";
import {
  ArrowSquareIn,
  ArrowSquareOut,
  CaretDown,
  ChartBar,
  Gear,
  Globe,
  Headset,
  LinkSimple,
  Plus,
  Plugs,
  QrCode,
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/m/dashboard", label: "Dashboard", Icon: ChartBar },
  { href: "/m/share", label: "Share", Icon: ShareNetwork },
] as const;

const PRIMITIVE_NAV = [
  { id: "presence", label: "Presence", Icon: Globe, route: "dynamic" },
  { id: "ownership", label: "Ownership", Icon: UsersThree, href: "/m/ownership" },
  { id: "connect", label: "Connect", Icon: Plugs, route: "submenu" },
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
          "h-10 rounded-lg px-3 text-sm font-normal text-muted-foreground hover:bg-muted hover:text-foreground",
          "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground",
          "data-[active=true]:hover:bg-sidebar-accent data-[active=true]:hover:text-sidebar-accent-foreground",
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
                className="flex h-10 min-w-0 flex-1 items-center justify-between rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground"
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

        <SidebarSeparator className="mx-2 my-3 bg-border" />

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {PRIMITIVE_NAV.map((item) => {
                const presenceActive =
                  item.id === "presence" && pathname.startsWith("/m/presence/");

                if (item.id === "presence") {
                  const PRESENCE_OPTIONS = [
                    { label: "Web", Icon: Globe, href: "/m/presence/web" },
                    { label: "QR Code", Icon: QrCode, href: "/m/presence/qr" },
                    { label: "Link", Icon: LinkSimple, href: "/m/presence/link" },
                  ] as const;
                  return (
                    <SidebarMenuItem key="presence">
                      <SidebarMenuButton
                        asChild
                        isActive={presenceActive}
                        className={cn(
                          "h-10 rounded-lg px-3 text-sm font-normal text-muted-foreground hover:bg-muted hover:text-foreground",
                          "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground",
                          "data-[active=true]:hover:bg-sidebar-accent data-[active=true]:hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Link href="/m/presence/web" onClick={closeOnNavigate}>
                          <Globe size={18} weight={presenceActive ? "fill" : "regular"} />
                          <span>Entry Points</span>
                        </Link>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-muted hover:text-foreground"
                            aria-label="Add presence"
                          >
                            <Plus size={12} weight="bold" aria-hidden />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="w-40">
                          {PRESENCE_OPTIONS.map(({ label, Icon, href }) => (
                            <DropdownMenuItem key={label} asChild>
                              <Link href={href} onClick={closeOnNavigate} className="flex items-center gap-2">
                                <Icon size={14} />
                                {label}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                }

                if (item.id === "connect") {
                  const connectActive = pathname.startsWith("/m/connect");
                  return (
                    <SidebarMenuItem key="connect">
                      <SidebarMenuButton
                        isActive={connectActive}
                        className={cn(
                          "h-10 rounded-lg px-3 text-sm font-normal text-muted-foreground hover:bg-muted hover:text-foreground",
                          "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground",
                        )}
                      >
                        <Plugs size={18} weight={connectActive ? "fill" : "regular"} />
                        <span>Connect</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/m/connect/in" || pathname.startsWith("/m/connect/in/")}>
                            <Link href="/m/connect/in" onClick={closeOnNavigate}><ArrowSquareIn size={14} />In</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/m/connect/out" || pathname.startsWith("/m/connect/out/")}>
                            <Link href="/m/connect/out" onClick={closeOnNavigate}><ArrowSquareOut size={14} />Out</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
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

        <SidebarSeparator className="mx-2 my-3 bg-border" />

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
