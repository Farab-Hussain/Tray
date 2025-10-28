"use client";
import React from "react";
import { Bookmark, Star, CheckCircle } from "lucide-react";
import Image from "next/image";
import ServiceIcon from "./ServiceIcon";

export interface ServiceCardProps {
  id: string;
  icon: string;
  title: string;
  description: string;
  tags?: string[];
  rating: number;
  isVerified?: boolean;
  proposalsCount: string;
  isBookmarked?: boolean;
  onBookmark?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
  // Action buttons props
  showApplyButton?: boolean;
  showDeleteButton?: boolean;
  isApplied?: boolean;
  onApply?: (id: string) => void;
  onDelete?: (id: string) => void;
  // Consultant info
  consultant?: {
    uid: string;
    name: string;
    category: string;
    rating: number;
    totalReviews: number;
    profileImage?: string;
  };
  isDefault?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  icon,
  title,
  description,
  tags = [],
  rating,
  isVerified = false,
  proposalsCount,
  isBookmarked = false,
  onBookmark,
  onClick,
  className = "",
  showApplyButton = false,
  showDeleteButton = false,
  isApplied = false,
  onApply,
  onDelete,
  consultant,
  isDefault = false,
}) => {
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark?.(id);
  };

  const handleCardClick = () => {
    onClick?.(id);
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApply?.(id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(id);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "fill-yellow text-yellow" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-100 w-full ${className}`}
      onClick={handleCardClick}
    >
      <div className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* Service Icon */}
            <div className="flex-shrink-0">
              <ServiceIcon type={icon} className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            
            {/* Title */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-black truncate">
                {title}
              </h3>
            </div>
          </div>
          
          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkClick}
            className="flex-shrink-0 p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ml-2"
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark
              className={`h-4 w-4 sm:h-5 sm:w-5 ${
                isBookmarked ? "fill-gray-600 text-gray-600" : "text-gray-400"
              }`}
            />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Consultant Info */}
        {consultant && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
            {consultant.profileImage ? (
              <Image
                src={consultant.profileImage}
                alt={consultant.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-700 font-semibold text-xs">
                  {consultant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {consultant.name}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {consultant.category}
              </p>
            </div>
            {isDefault && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex-shrink-0">
                Default
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer Section */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Left side - Rating and Verification */}
          <div className="flex items-center gap-3">
            {/* Rating */}
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              {renderStars(rating)}
            </div>

            {/* Verification Status */}
            {isVerified && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-gray-600 text-xs">Project Verified</span>
              </div>
            )}
          </div>

          {/* Right side - Proposals and Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Proposals Count */}
            <div className="text-right flex-shrink-0">
              <span className="text-black font-semibold text-xs sm:text-sm">Proposals:</span>
              <span className="text-gray-600 text-xs sm:text-sm ml-1">{proposalsCount}</span>
            </div>

            {/* Action Buttons */}
            {(showApplyButton || showDeleteButton) && (
              <div className="flex gap-1">
                {showApplyButton && !isApplied && (
                  <button
                    onClick={handleApplyClick}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded h-6 flex items-center transition-colors"
                  >
                    Apply
                  </button>
                )}
                {isApplied && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full h-6 flex items-center">
                    Applied
                  </span>
                )}
                {showDeleteButton && (
                  <button
                    onClick={handleDeleteClick}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded h-6 flex items-center transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
