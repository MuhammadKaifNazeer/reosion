import { AppSidebar } from "@/components/app-shell/app-sidebar";

/** Sidebar shell shared by the dashboard, settings and projects listing. */
export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="min-w-0 flex-1 bg-background">{children}</div>
    </div>
  );
}
