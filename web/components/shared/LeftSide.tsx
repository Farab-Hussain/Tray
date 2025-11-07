"use client";
import { 
  PanelLeft, 
  PanelRight, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield, 
  MessageSquare,
  Activity,
  Database,
  Bell,
  Search,
  TrendingUp,
  Calendar,
  UserCheck,
  AlertTriangle,
  Mail,
  Filter,
  Download,
  LogOut
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Button from "../custom/Button";
import { useAuth } from "@/contexts/AuthContext";

const LeftSide = () => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Check if we're on admin pages
  const isAdminPage = pathname.includes("/admin");

  // Handle logo click navigation
  const handleLogoClick = () => {
    if (isAdminPage) {
      router.push("/admin");
    } else {
      router.push("/admin");
    }
  };

  const adminNavItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: BarChart3,
      isActive: pathname === "/admin"
    },
    {
      href: "/admin/consultant-profiles",
      label: "Consultant Profiles",
      icon: Users,
      isActive: pathname.includes("/admin/consultant-profiles")
    },
    {
      href: "/admin/service-applications",
      label: "Service Applications",
      icon: FileText,
      isActive: pathname.includes("/admin/service-applications")
    },
    {
      href: "/admin/users",
      label: "User Management",
      icon: Shield,
      isActive: pathname.includes("/admin/users")
    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      icon: TrendingUp,
      isActive: pathname.includes("/admin/analytics")
    },
    {
      href: "/admin/support",
      label: "Support",
      icon: MessageSquare,
      isActive: pathname.includes("/admin/support")
    },
    {
      href: "/admin/activity",
      label: "Activity Log",
      icon: Activity,
      isActive: pathname.includes("/admin/activity")
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      isActive: pathname.includes("/admin/settings")
    }
  ];

  return (
    <div
      className={`hidden layout sm:flex sticky top-0 border flex-col justify-between items-start min-w-0 p-2 sm:p-5 transition-all duration-700 
        ${
          isOpen
            ? "w-28 sm:w-1/5 lg:w-1/6 h-auto lg:h-screen"
            : "w-12 sm:w-16 lg:w-20 h-auto lg:h-screen"
        }
      `}
    >
      <div className="w-full flex flex-col">
        <Button
          variant="ghost"
          size="sm"
          icon={isOpen ? PanelLeft : PanelRight}
          onClick={handleClick}
          className="cursor-pointer mb-2"
        />
        
        {!isOpen ? (
          <div className="flex flex-col gap-2">
            {adminNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`p-2 rounded transition-colors ${
                  item.isActive 
                    ? 'bg-green-100 text-green-600' 
                    : 'hover:bg-gray-200'
                }`}
                title={item.label}
              >
                <item.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        ) : (
          <div className="w-full">
            <main className="overflow-hidden w-full">
              <h1 className="text-base sm:text-lg py-1 sm:py-3 truncate max-w-full">
                Admin Dashboard
              </h1>
              
              {/* Navigation links */}
              <nav className="mt-4 flex flex-col gap-2">
                {adminNavItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 text-sm sm:text-base px-2 py-1 rounded transition-colors ${
                      item.isActive 
                        ? 'bg-green-100 text-green-700 font-medium' 
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </a>
                ))}
              </nav>
            </main>
          </div>
        )}
      </div>
      
      {/* Bottom section with logout and logo */}
      <div className="w-full mt-auto space-y-4 pt-4">
        {!isOpen ? (
          <>
            <button
              onClick={handleLogout}
              className="w-full p-2 rounded transition-colors hover:bg-red-100 text-red-600 flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="w-full flex justify-center">
              <button
                onClick={handleLogoClick}
                className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                title="Go to admin dashboard"
              >
                <Image
                  src="/icons/logo.svg"
                  alt="Logo"
                  className="h-12 w-auto"
                  width={120}
                  height={120}
                />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-sm sm:text-base px-2 py-2 rounded transition-colors bg-red-50 hover:bg-red-100 text-red-700 font-medium border border-red-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
            
            {/* Logo */}
            <div className="w-full flex justify-center">
              <button
                onClick={handleLogoClick}
                className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                title="Go to admin dashboard"
              >
                <Image
                  src="/icons/logo.svg"
                  alt="Logo"
                  className="h-24 w-auto"
                  width={240}
                  height={240}
                />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeftSide;