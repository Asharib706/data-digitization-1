"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Dashboard", icon: "📊", href: "/dashboard" },
  { label: "All Invoices", icon: "🗂️", href: "/invoices" },
  { label: "Upload Invoice", icon: "📤", href: "/upload" },
  { label: "Add Manually", icon: "✏️", href: "/add" },
  { label: "Summary Report", icon: "📅", href: "/summary" },
];

function SidebarContent({ pathname, session, onClose }: { pathname: string; session: ReturnType<typeof useSession>["data"]; onClose?: () => void }) {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <div className="sidebar-logo">
        <span className="logo-dot" />
        InvoiceAI
        {onClose && (
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Management</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`nav-link ${pathname === item.href ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {pathname === item.href && <span className="nav-active-dot" />}
          </Link>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-row">
          <div className="user-avatar">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="user-name">{session?.user?.name || "User"}</div>
            <div className="user-role">Admin</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          🚪 Sign Out
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar desktop-sidebar">
        <SidebarContent pathname={pathname} session={session} />
      </aside>

      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <div className="mobile-logo">
          <span className="logo-dot" style={{ width: 7, height: 7 }} />
          InvoiceAI
        </div>
        <div className="mobile-avatar">
          {session?.user?.name?.[0]?.toUpperCase() || "U"}
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="sidebar mobile-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <SidebarContent pathname={pathname} session={session} onClose={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
