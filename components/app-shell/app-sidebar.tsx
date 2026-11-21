"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  LayoutDashboard,
  Settings,
  UserRound,
} from "lucide-react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "next-themes";
import { Logo, Wordmark } from "@/components/app-shell/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
] as const;

const FOOTER_ITEMS = [
  { icon: Settings, label: "Settings", href: "/settings" },
  {
    icon: CircleHelp,
    label: "Help",
    href: "https://github.com/MuhammadKaifNazeer/reosion/issues",
    external: true,
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // load-on-mount: peak down to persist the user's preferred width
    // eslint-disable-next-line react-hooks/set-state-in-effect -- safe: one-shot read of an external system
    setExpanded(window.localStorage.getItem("reosion:sidebar") !== "collapsed");
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      window.localStorage.setItem(
        "reosion:sidebar",
        prev ? "collapsed" : "expanded",
      );
      return !prev;
    });
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      data-expanded={expanded}
      className={cn(
        // sticky: keeps the full sidebar in view while the page content
        // scrolls beside it.
        "sticky top-0 flex h-dvh flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-150",
        expanded ? "w-52" : "w-13",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 px-3",
          expanded ? "h-14" : "h-auto flex-col justify-center gap-1 py-2",
        )}
      >
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Logo />
          {expanded ? <Wordmark /> : null}
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("text-muted-foreground", expanded && "ml-auto")}
          onClick={toggle}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <ChevronsLeft />
          ) : (
            <ChevronsRight />
          )}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isActive(item.href)}
            expanded={expanded}
          />
        ))}

        <div className="mt-auto flex flex-col gap-1">
          <Separator className="mb-1 bg-sidebar-border" />
          {FOOTER_ITEMS.map((item) => (
            <SidebarLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isActive(item.href)}
              expanded={expanded}
              external={"external" in item && item.external}
            />
          ))}
           <div
             className={cn(
               "mt-1 flex items-center gap-2 rounded-md px-2 py-1.5",
               !expanded && "flex-col justify-center gap-1 px-0",
             )}
           >
             <Button
               variant="ghost"
               size="icon-sm"
               className={cn(
                 "text-muted-foreground",
                 expanded ? "ml-auto order-3" : "ml-0 order-1",
               )}
               aria-label="Toggle theme"
               onClick={() =>
                 setTheme(resolvedTheme === "dark" ? "light" : "dark")
               }
             >
               {mounted && resolvedTheme === "dark" ? (
                 <Sun className="size-3.5" />
               ) : (
                 <Moon className="size-3.5" />
               )}
             </Button>
             <span
               className={cn(
                 "flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] text-muted-foreground",
                 !expanded && "order-2",
               )}
               aria-hidden
             >
               <UserRound className="size-3.5" />
             </span>
             {expanded ? (
               <span className="truncate text-xs text-muted-foreground">
                 Local user
               </span>
             ) : null}
           </div>
        </div>
      </nav>
    </aside>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  href,
  active,
  expanded,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active: boolean;
  expanded: boolean;
  external?: boolean;
}) {
  const link = external ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex h-7 items-center gap-2 rounded-md px-2 text-xs font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        !expanded && "justify-center px-0",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {expanded ? label : null}
      <span className="sr-only">(external link)</span>
    </a>
  ) : (
    <Link
      href={href}
      className={cn(
        "flex h-7 items-center gap-2 rounded-md px-2 text-xs font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        !expanded && "justify-center px-0",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-3.5 shrink-0" />
      {expanded ? label : null}
    </Link>
  );

  if (expanded) return link;
  return (
    <Tooltip>
      <TooltipTrigger
        delay={300}
        render={link}
      />
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
