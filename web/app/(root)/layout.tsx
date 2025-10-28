'use client';

import Header from "@/components/shared/Header";
import LeftSide from "@/components/shared/LeftSide";
import RightSide from "@/components/shared/RightSide";
import { AuthProvider } from '@/contexts/AuthContext';
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <main className="flex h-dvh w-full overflow-x-visible bg-background">
        <LeftSide />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="h-fit w-full border-1">
            <Header />
          </div>
          <div className="flex-1 w-full p-3 sm:p-10 min-w-0 overflow-y-auto">
            {children}
          </div>
        </div>
        <RightSide />
      </main>
    </AuthProvider>
  );
};

export default layout;
