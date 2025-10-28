'use client';

import React from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AdminRouteGuard>
      {children}
    </AdminRouteGuard>
  );
};

export default AdminLayout;
