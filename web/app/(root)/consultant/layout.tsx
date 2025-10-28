import React from 'react';
import ConsultantRouteGuard from '@/components/consultant/ConsultantRouteGuard';

/**
 * Consultant Dashboard Layout
 * 
 * This layout wraps all consultant pages with the ConsultantRouteGuard
 * to ensure proper access control based on profile status.
 */
export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsultantRouteGuard>
      {children}
    </ConsultantRouteGuard>
  );
}

