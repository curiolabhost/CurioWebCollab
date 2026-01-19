// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Users, LayoutGrid, BarChart3, Settings, LogOut, BookOpen } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if user is admin (you can customize this logic)
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      router.push("/account-setup/login");
      return;
    }

    // Optional: Check for admin role
    try {
      const user = JSON.parse(currentUser);
      // Add admin check here if needed
      // if (!user.isAdmin) router.push("/dashboard");
    } catch {
      router.push("/account-setup/login");
    }
  }, [router]);

  if (!mounted) {
    return null;
  }

  const navItems = [
    {
      name: "Students View",
      href: "/admin",
      icon: Users,
      exact: true,
    },
    {
      name: "Projects View",
      href: "/admin?view=projects",
      icon: LayoutGrid,
    },
  ];

  const secondaryItems = [
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href || pathname.startsWith("/admin/students");
    }
    return pathname === href;
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/account-setup/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col py-5">
        {/* Header */}
        <div className="px-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-sky-600">CURIO</span>
                <span className="text-orange-500">LAB</span>
              </h1>
            </div>
          </div>
          <p className="text-xs text-gray-500">Admin Portal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? "bg-sky-50 text-sky-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="h-px bg-gray-200 my-4" />

          <div className="space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? "bg-sky-50 text-sky-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 mt-5 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">Student Dashboard</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors py-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}