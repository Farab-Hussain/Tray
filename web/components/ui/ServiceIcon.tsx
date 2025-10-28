"use client";
import React from "react";

interface ServiceIconProps {
  type: string;
  className?: string;
}

const ServiceIcon: React.FC<ServiceIconProps> = ({ type, className = "" }) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    figma: (
      <div className="w-8 h-8 bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center relative">
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center relative">
          <span className="text-white font-bold text-sm">L</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-sm transform rotate-12"></div>
        </div>
      </div>
    ),
    react: (
      <div className="w-8 h-8 bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xs">R</span>
        </div>
      </div>
    ),
    node: (
      <div className="w-8 h-8 bg-green-100 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">N</span>
        </div>
      </div>
    ),
    python: (
      <div className="w-8 h-8 bg-yellow-100 border-2 border-dashed border-yellow-300 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">P</span>
        </div>
      </div>
    ),
    mobile: (
      <div className="w-8 h-8 bg-purple-100 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">M</span>
        </div>
      </div>
    ),
    devops: (
      <div className="w-8 h-8 bg-orange-100 border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">D</span>
        </div>
      </div>
    ),
  };

  return (
    <div className={className}>
      {iconMap[type] || (
        <div className="w-8 h-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 font-bold text-xs">?</span>
        </div>
      )}
    </div>
  );
};

export default ServiceIcon;
