"use client";
import React from "react";
import { LucideIcon } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-yellow hover:bg-lightYellow text-black focus:ring-yellow",
    secondary: "bg-green hover:bg-lightGreen text-white focus:ring-green",
    outline: "border-2 border-green text-green hover:bg-green hover:text-white focus:ring-green",
    ghost: "text-gray hover:bg-gray-100 focus:ring-gray-300",
    danger: "bg-red hover:bg-red-600 text-white focus:ring-red",
    success: "bg-green hover:bg-green-600 text-white focus:ring-green",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-2.5",
    xl: "px-8 py-4 text-xl gap-3",
  };

  const widthClass = fullWidth ? "w-full" : "";
  
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className,
  ].filter(Boolean).join(" ");

  const renderIcon = () => {
    if (loading) {
      return (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }
    
    if (Icon) {
      return <Icon className="h-4 w-4" />;
    }
    
    return null;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          {renderIcon()}
          <span>Loading...</span>
        </>
      );
    }

    if (Icon && iconPosition === "left") {
      return (
        <>
          {renderIcon()}
          {children && <span>{children}</span>}
        </>
      );
    }

    if (Icon && iconPosition === "right") {
      return (
        <>
          {children && <span>{children}</span>}
          {renderIcon()}
        </>
      );
    }

    if (Icon && !children) {
      return renderIcon();
    }

    return children ? <span>{children}</span> : null;
  };

  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default Button;
