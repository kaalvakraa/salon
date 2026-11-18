"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Scissors,
  Store,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { clearAuth, getStoredToken, getStoredUser, refreshCurrentUser } from "@/lib/auth";
import type { User } from "@/types/api";

type AppShellProps = {
  area?: "public" | "admin" | "stylist";
  children: React.ReactNode;
};

type NavLink = { href: string; label: string; icon: LucideIcon };

const adminLinks: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/salon", label: "Salon", icon: Store },
  { href: "/admin/services", label: "Services", icon: Scissors },
  { href: "/admin/stylists", label: "Stylists", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
];

const stylistLinks: NavLink[] = [
  { href: "/stylist/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stylist/profile", label: "Profile", icon: UserRound },
  { href: "/stylist/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/stylist/history", label: "History", icon: History },
  { href: "/stylist/walk-in", label: "Walk-in", icon: PlusCircle },
];

export function AppShell({ area = "public", children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeArea = user?.role ?? (area !== "public" ? area : undefined);
  const links = activeArea === "admin" ? adminLinks : activeArea === "stylist" ? stylistLinks : [];
  const isPortal = links.length > 0;

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      return;
    }
    setUser(getStoredUser());

    refreshCurrentUser(token)
      .then(setUser)
      .catch(() => {
        clearAuth();
        setUser(null);
      });
  }, []);

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function logout() {
    clearAuth();
    router.push("/login");
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <div className={`app-shell${isPortal ? " has-bottom-nav" : ""}`}>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Varchasv Salon Management home">
          <span className="brand-mark">V</span>
          <span className="brand-meta">
            <span>Varchasv Salon</span>
            <small>Salon Management</small>
          </span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav
          id="primary-nav"
          className={`topnav${menuOpen ? " open" : ""}${isPortal ? " portal" : ""}`}
          aria-label="Primary"
        >
          {!isPortal ? (
            <>
              <Link href="/" className={pathname === "/" ? "active" : ""}>
                Home
              </Link>
              <Link
                href="/customer/booking"
                className={isActive("/customer/booking") ? "active" : ""}
              >
                Book
              </Link>
              <Link href="/admin/login">Admin</Link>
              <Link href="/stylist/login">Stylist</Link>
              <Link href="/customer/booking" className="cta">
                Reserve
              </Link>
            </>
          ) : (
            <>
              {links.map(({ href, label }) => (
                <Link
                  href={href}
                  key={href}
                  className={`nav-link${isActive(href) ? " active" : ""}`}
                >
                  {label}
                </Link>
              ))}
              <Link href="/customer/booking" className="cta">
                Public booking
              </Link>
            </>
          )}
          {user ? (
            <button className="text-button" onClick={logout}>
              <LogOut className="logout-icon" aria-hidden="true" /> Logout
            </button>
          ) : null}
        </nav>
      </header>
      {children}
      <footer className="footer">
        <div>
          <strong style={{ color: "var(--ink)" }}>Varchasv Salon Management</strong> — bookings,
          stylists and the front desk in one place
        </div>
        <div className="row" style={{ gap: 18 }}>
          <Link href="/customer/booking">Book</Link>
          <Link href="/admin/login">For admins</Link>
          <Link href="/stylist/login">For stylists</Link>
        </div>
      </footer>
      {isPortal ? (
        <nav className="bottom-nav" aria-label="Sections">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              className={isActive(href) ? "active" : ""}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
