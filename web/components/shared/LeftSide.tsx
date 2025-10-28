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
  Download
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Button from "../custom/Button";

const LeftSide = () => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  
  const handleClick = () => {
    setIsOpen(!isOpen);
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
      className={`hidden layout sm:flex sticky top-0 border flex-col justify-start items-start min-w-0 p-2 sm:p-5 transition-all duration-700 
        ${
          isOpen
            ? "w-28 sm:w-1/5 lg:w-1/6 h-auto lg:h-screen"
            : "w-12 sm:w-16 lg:w-20 h-auto lg:h-screen"
        }
      `}
    >
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
          
          <div className="mt-auto w-full flex justify-center pt-4">
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
        </div>
      )}
    </div>
  );
};

export default LeftSide;