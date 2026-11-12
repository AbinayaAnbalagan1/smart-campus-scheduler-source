import { Link } from "@tanstack/react-router";
import { CalendarRange, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/teacher-schedule", label: "Teacher Schedule" },
  { to: "/student-schedule", label: "Student Schedule" },
  { to: "/bookings", label: "Bookings" },
  { to: "/manage-data", label: "Manage Data" },
] as const;

export function AppNav() {
  const { signOut, username, role } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-[var(--shadow-nav)] print:hidden">
      <div className="campus-container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <CalendarRange className="h-5 w-5" aria-hidden="true" />
          <span className="text-lg">Smart Campus Scheduler</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium opacity-85 transition-colors hover:bg-primary-foreground/12 hover:opacity-100 [&.active]:bg-primary-foreground/18 [&.active]:opacity-100"
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {username ? (
            <span className="text-xs opacity-80">
              {username}
              {role ? ` · ${role}` : ""}
            </span>
          ) : null}
          <Button variant="secondary" size="sm" onClick={signOut}>
            <LogOut className="mr-1 h-4 w-4" aria-hidden="true" /> Logout
          </Button>
        </div>

        <button
          type="button"
          className="rounded-md p-2 md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className={cn("border-t border-primary-foreground/15 md:hidden", open ? "block" : "hidden")}>
        <nav className="campus-container flex flex-col py-2" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium opacity-90"
            >
              {link.label}
            </Link>
          ))}
          <Button variant="secondary" size="sm" className="mt-2 w-fit" onClick={signOut}>
            <LogOut className="mr-1 h-4 w-4" aria-hidden="true" /> Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
