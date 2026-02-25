'use client';

import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  BarChart3,
  BookOpen,
  MessageSquare,
  Activity,
  Settings as SettingsIcon,
  ClipboardCheck
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MobileHeaderProps {
  title: string;
  onSearch?: (term: string) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onSearch }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: pathname === '/admin'
    },
    {
      name: 'Consultant Profiles',
      href: '/admin/consultant-profiles',
      icon: Users,
      current: pathname.startsWith('/admin/consultant-profiles')
    },
    {
      name: 'Service Applications',
      href: '/admin/service-applications',
      icon: FileText,
      current: pathname.startsWith('/admin/service-applications')
    },
    {
      name: 'Course Approvals',
      href: '/admin/course-approvals',
      icon: BookOpen,
      current: pathname.startsWith('/admin/course-approvals')
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Shield,
      current: pathname.startsWith('/admin/users')
    },
    {
      name: 'Work Eligibility',
      href: '/admin/work-eligibility',
      icon: ClipboardCheck,
      current: pathname.startsWith('/admin/work-eligibility')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: pathname.startsWith('/admin/analytics')
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: MessageSquare,
      current: pathname.startsWith('/admin/support')
    },
    {
      name: 'Activity Log',
      href: '/admin/activity',
      icon: Activity,
      current: pathname.startsWith('/admin/activity')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: SettingsIcon,
      current: pathname.startsWith('/admin/settings')
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Title */}
          <h1 className="text-lg font-semibold text-gray-900 truncate mx-4">
            {title}
          </h1>

          {/* Search Icon */}
          <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </form>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          item.current
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </a>
                    );
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bell className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Notifications</p>
                    <p className="text-xs text-gray-500">3 new alerts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
