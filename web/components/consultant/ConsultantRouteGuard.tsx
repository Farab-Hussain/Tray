'use client';

import React from 'react';

interface ConsultantRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Route Guard for Consultant Dashboard
 * 
 * Note: Backend integration removed - all routes are now accessible without restrictions.
 * This component currently just renders children. Route protection can be re-enabled
 * when backend integration is restored.
 */
const ConsultantRouteGuard: React.FC<ConsultantRouteGuardProps> = ({ children }) => {
  // Simply render children - no route protection when backend is disconnected
  return <>{children}</>;
};

export default ConsultantRouteGuard;

