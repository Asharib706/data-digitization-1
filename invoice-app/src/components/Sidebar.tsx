"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { label: "Dashboard", icon: "📊", href: "/dashboard" },
    { label: "Upload Invoice", icon: "📤", href: "/upload" },
    { label: "Add Manually", icon: "✏️", href: "/add" },
    { label: "Summary Report", icon: "📅", href: "/summary" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-dot" />
        InvoiceAI
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Management</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="nav-label">Settings</div>
        <Link
          href="/danger"
          className={`nav-link ${pathname === "/danger" ? "active" : ""}`}
        >
          <span className="nav-icon">⚠️</span>
          Danger Zone
        </Link>
      </nav>

      <div className="sidebar-user">
        <div className="user-row">
          <div className="user-avatar">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="user-name">{session?.user?.name || "User"}</div>
        </div>
        <button onClick={() => signOut()} className="btn-logout">
          Sign Out
        </button>
      </div>
    </aside>
  );
}
