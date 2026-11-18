import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@evoapi/design-system/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@evoapi/design-system/dropdown-menu";
import {
  ChevronDown,
  CircleHelp,
  Cog,
  FileQuestion,
  IterationCcw,
  LayoutDashboard,
  MessageCircle,
  PanelLeft,
  PanelLeftClose,
  X,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

import { useTheme } from "@/components/theme-provider";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { useInstance } from "@/contexts/InstanceContext";
import { useSidebar } from "@/contexts/SidebarContext";

import { FEATURES, FeatureKey, isFeatureEnabled } from "@/lib/provider/features";
import { cn } from "@/lib/utils";

const GATED_IDS = new Set<string>(Object.keys(FEATURES));
const isGated = (id: string): id is FeatureKey => GATED_IDS.has(id);
const shouldShow = (id?: string) => !id || !isGated(id) || isFeatureEnabled(id);

type MenuLeaf = {
  id: string;
  title: string;
  icon?: typeof LayoutDashboard;
  path?: string;
  link?: string;
};

type MenuGroup = {
  title: string;
  icon: typeof LayoutDashboard;
  children: MenuLeaf[];
};

type Menu = MenuLeaf | MenuGroup;

function SidebarShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isCollapsed, isMobileOpen, toggleDesktop, closeMobile } = useSidebar();
  const logoSrc =
    theme === "dark"
      ? "https://evolution-api.com/files/evo/evolution-logo-white.svg"
      : "https://evolution-api.com/files/evo/evolution-logo.svg";

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Drawer (Always full width w-64) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-in-out md:hidden border-r border-sidebar-border",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          <img
            src={logoSrc}
            alt="Evolution API"
            className="h-7"
            onError={(e) => {
              e.currentTarget.src = "/assets/images/evolution-logo.png";
            }}
          />
          <button
            type="button"
            onClick={closeMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1" onClick={() => closeMobile()}>
          {children}
        </nav>

        {footer && (
          <div className="border-t border-sidebar-border px-2.5 py-3 space-y-1 shrink-0">
            {footer}
          </div>
        )}

        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className="text-sm font-medium text-primary">Evolution Manager</div>
          <div className="mt-1 text-xs text-muted-foreground">© {currentYear} All rights reserved</div>
        </div>
      </aside>

      {/* Desktop Mini / Expanded Sidebar (w-16 or w-56) */}
      <aside
        className={cn(
          "hidden md:flex bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border transition-[width] duration-300 ease-in-out shrink-0 select-none",
          isCollapsed ? "w-16" : "w-56",
        )}
      >
        {/* Sidebar Header with Logo and Hover Toggle */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-sidebar-border shrink-0",
            isCollapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          {isCollapsed ? (
            /* Mini Sidebar Top Logo with Hover Toggle */
            <TooltipWrapper content={t("sidebar.show", { defaultValue: "Expandir menu lateral (Ctrl+B)" })} side="right">
              <button
                type="button"
                onClick={toggleDesktop}
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 hover:bg-sidebar-accent hover:border-sidebar-border text-sidebar-foreground transition-all duration-200 cursor-pointer shadow-2xs active:scale-95"
                title={t("sidebar.show", { defaultValue: "Expandir menu lateral (Ctrl+B)" })}
              >
                {/* Default state: Logo */}
                <div className="flex items-center justify-center transition-all duration-200 group-hover:opacity-0 group-hover:scale-75">
                  <img
                    src="/assets/images/evolution-logo.png"
                    alt="Evolution API"
                    className="h-5 w-auto max-w-[32px] object-contain"
                  />
                </div>

                {/* Hover state: Expand icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 text-primary">
                  <PanelLeft className="h-5 w-5" />
                </div>
              </button>
            </TooltipWrapper>
          ) : (
            /* Expanded Mode: Full Logo + Collapse Button */
            <>
              <img
                src={logoSrc}
                alt="Evolution API"
                className="h-7 cursor-pointer"
                onClick={toggleDesktop}
                onError={(e) => {
                  e.currentTarget.src = "/assets/images/evolution-logo.png";
                }}
              />
              <TooltipWrapper content={t("sidebar.hide", { defaultValue: "Minimizar menu lateral (Ctrl+B)" })} side="bottom">
                <button
                  type="button"
                  onClick={toggleDesktop}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-foreground transition-all active:scale-95 shadow-2xs"
                  title={t("sidebar.hide", { defaultValue: "Minimizar menu lateral (Ctrl+B)" })}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </TooltipWrapper>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-3",
            isCollapsed
              ? "flex flex-col items-center gap-1.5 px-2"
              : "space-y-1 px-2.5",
          )}
        >
          {children}
        </nav>

        {/* Footer Links */}
        {footer && (
          <div
            className={cn(
              "border-t border-sidebar-border shrink-0 py-3",
              isCollapsed
                ? "flex flex-col items-center gap-1.5 px-2"
                : "space-y-1 px-2.5",
            )}
          >
            {footer}
          </div>
        )}

        {/* Version / Copyright Info */}
        <div
          className={cn(
            "border-t border-sidebar-border shrink-0 flex items-center",
            isCollapsed ? "justify-center py-3 px-1" : "justify-between p-4",
          )}
        >
          {!isCollapsed ? (
            <div>
              <div className="text-sm font-medium text-primary">Evolution Manager</div>
              <div className="mt-0.5 text-xs text-muted-foreground">© {currentYear} All rights reserved</div>
            </div>
          ) : (
            <TooltipWrapper content={`Evolution Manager © ${currentYear}`} side="right">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground/70 hover:text-primary transition-colors cursor-default">
                v2.0
              </span>
            </TooltipWrapper>
          )}
        </div>
      </aside>
    </>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  isExternal,
  end,
}: {
  to: string;
  icon?: typeof LayoutDashboard;
  label: string;
  isExternal?: boolean;
  end?: boolean;
}) {
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  const currentPath = location.pathname;
  const isActive = end
    ? currentPath === to || currentPath === `${to}/`
    : currentPath === to || currentPath.startsWith(`${to}/`);

  if (isCollapsed) {
    const trigger = isExternal ? (
      <a
        href={to}
        target="_blank"
        rel="noreferrer"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all"
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
      </a>
    ) : (
      <NavLink
        to={to}
        end={end}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
          isActive
            ? "bg-primary/15 text-primary border border-primary/30 shadow-xs font-semibold"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground border border-transparent",
        )}
      >
        {Icon && <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />}
      </NavLink>
    );

    return (
      <TooltipWrapper content={label} side="right">
        {trigger}
      </TooltipWrapper>
    );
  }

  if (isExternal) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground"
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <span>{label}</span>
      </a>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      {Icon && <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />}
      <span>{label}</span>
    </NavLink>
  );
}

function SidebarGroupItem({
  menu,
  base,
  pathname,
}: {
  menu: MenuGroup;
  base: string;
  pathname: string;
}) {
  const { isCollapsed } = useSidebar();
  const groupActive = menu.children.some((c) => c.path && (pathname.includes("/" + c.path) || pathname.endsWith(c.path)));

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <TooltipWrapper content={menu.title} side="right">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer",
                groupActive
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground border border-transparent",
              )}
            >
              <menu.icon className={cn("h-5 w-5 shrink-0 transition-colors", groupActive ? "text-primary" : "text-muted-foreground")} />
            </button>
          </DropdownMenuTrigger>
        </TooltipWrapper>
        <DropdownMenuContent side="right" align="start" className="w-48 p-1.5 shadow-xl border border-border bg-popover text-popover-foreground rounded-xl">
          <div className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 mb-1">
            {menu.title}
          </div>
          {menu.children.map((child) => {
            const childActive = pathname === `${base}/${child.path}` || pathname.startsWith(`${base}/${child.path}/`);
            return (
              <DropdownMenuItem key={child.id} asChild>
                <NavLink
                  to={`${base}/${child.path}`}
                  className={cn(
                    "flex items-center rounded-lg px-2.5 py-1.5 text-sm transition-colors w-full cursor-pointer",
                    childActive
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  {child.title}
                </NavLink>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Collapsible defaultOpen={groupActive}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          groupActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        )}
      >
        <menu.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", groupActive ? "text-primary" : "text-muted-foreground")} />
        <span>{menu.title}</span>
        <ChevronDown className="ml-auto h-4 w-4 transition-transform data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-7 mt-1 flex flex-col gap-1 border-l border-sidebar-border pl-3">
        {menu.children.map((child) => (
          <NavLink
            key={child.id}
            to={`${base}/${child.path}`}
            className={({ isActive }) =>
              cn(
                "rounded-md px-3 py-1.5 text-sm transition-all",
                isActive ? "text-primary font-semibold bg-primary/10" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {child.title}
          </NavLink>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ExternalLinks() {
  const { t } = useTranslation();
  return (
    <>
      <NavItem to="https://docs.evolutionfoundation.com.br/" icon={FileQuestion} label={t("sidebar.documentation")} isExternal />
      <NavItem to="https://evolution-api.com/postman" icon={CircleHelp} label={t("sidebar.postman")} isExternal />
      <NavItem to="https://evolution-api.com/discord" icon={MessageCircle} label={t("sidebar.discord")} isExternal />
    </>
  );
}

function MainSidebar() {
  const { t } = useTranslation();
  return (
    <SidebarShell footer={<ExternalLinks />}>
      <NavItem to="/manager" icon={LayoutDashboard} label={t("sidebar.dashboard")} end />
    </SidebarShell>
  );
}

function InstanceSidebar() {
  const { t } = useTranslation();
  const { instance } = useInstance();
  const { pathname } = useLocation();
  const { isCollapsed } = useSidebar();

  const base = instance ? `/manager/instance/${instance.id}` : "";

  const menus: Menu[] = useMemo(
    () => [
      { id: "dashboard", title: t("sidebar.dashboard"), icon: LayoutDashboard, path: "dashboard" },
      { id: "chat", title: t("sidebar.chat"), icon: MessageCircle, path: "chat" },
      {
        title: t("sidebar.configurations"),
        icon: Cog,
        children: [
          { id: "settings", title: t("sidebar.settings"), path: "settings" },
          { id: "proxy", title: t("sidebar.proxy"), path: "proxy" },
        ],
      },
      {
        title: t("sidebar.events"),
        icon: IterationCcw,
        children: [
          { id: "webhook", title: t("sidebar.webhook"), path: "webhook" },
          { id: "websocket", title: t("sidebar.websocket"), path: "websocket" },
          { id: "rabbitmq", title: t("sidebar.rabbitmq"), path: "rabbitmq" },
          { id: "sqs", title: t("sidebar.sqs"), path: "sqs" },
        ],
      },
      {
        title: t("sidebar.integrations"),
        icon: Zap,
        children: [
          { id: "evoai", title: t("sidebar.evoai"), path: "evoai" },
          { id: "n8n", title: t("sidebar.n8n"), path: "n8n" },
          { id: "evolutionBot", title: t("sidebar.evolutionBot"), path: "evolutionBot" },
          { id: "chatwoot", title: t("sidebar.chatwoot"), path: "chatwoot" },
          { id: "typebot", title: t("sidebar.typebot"), path: "typebot" },
          { id: "openai", title: t("sidebar.openai"), path: "openai" },
          { id: "dify", title: t("sidebar.dify"), path: "dify" },
          { id: "flowise", title: t("sidebar.flowise"), path: "flowise" },
        ],
      },
    ],
    [t],
  );

  const visibleMenus = useMemo(
    () =>
      menus
        .map((menu) => {
          if ("children" in menu) {
            return { ...menu, children: menu.children.filter((c) => shouldShow(c.id)) };
          }
          return menu;
        })
        .filter((menu) => {
          if ("children" in menu) return menu.children.length > 0;
          return shouldShow(menu.id);
        }),
    [menus],
  );

  const isManagerActive = pathname === "/manager" || pathname === "/manager/";

  return (
    <SidebarShell footer={<ExternalLinks />}>
      {/* Back to Instances Button */}
      {isCollapsed ? (
        <TooltipWrapper content={`← ${t("dashboard.title")}`} side="right">
          <NavLink
            to="/manager"
            end
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
              isManagerActive
                ? "bg-primary/15 text-primary border border-primary/30 shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-primary border border-transparent",
            )}
          >
            <LayoutDashboard className={cn("h-5 w-5 shrink-0 transition-colors", isManagerActive ? "text-primary" : "text-muted-foreground")} />
          </NavLink>
        </TooltipWrapper>
      ) : (
        <NavLink
          to="/manager"
          end
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
            isManagerActive
              ? "bg-primary/15 text-primary border border-primary/30 shadow-xs"
              : "text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 shadow-2xs",
          )}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0 text-primary" />
          <span>{`← ${t("dashboard.title")}`}</span>
        </NavLink>
      )}

      {/* Clean Divider */}
      <div className={cn("border-t border-sidebar-border/70", isCollapsed ? "my-1.5 w-7" : "my-2 w-full")} />

      {/* Main Menu Items */}
      {visibleMenus.map((menu) => {
        if ("children" in menu) {
          return (
            <SidebarGroupItem
              key={menu.title}
              menu={menu}
              base={base}
              pathname={pathname}
            />
          );
        }
        return <NavItem key={menu.id} to={`${base}/${menu.path}`} icon={menu.icon} label={menu.title} />;
      })}
    </SidebarShell>
  );
}

export { MainSidebar, InstanceSidebar };
