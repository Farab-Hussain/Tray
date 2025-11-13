'use client';

import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  PanelRight, 
  Users,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { consultantAPI } from '@/utils/api';

interface Consultant {
  uid: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  profileImage?: string | null;
  personalInfo?: {
    fullName?: string;
    profileImage?: string | null;
  };
}

const RightSide = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleConsultantClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    router.push('/admin/users');
  };

  const loadConsultants = async () => {
    try {
      setIsLoading(true);
      const response = await consultantAPI.getAll();
      const consultantsData = response.data as { consultants?: Consultant[] };
      setConsultants(consultantsData.consultants || []);
    } catch (error) {
      console.error('Error loading consultants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConsultants();
  }, []);

  if (!isOpen) {
    return (
      <div className="hidden layout sm:flex sticky top-0 border flex-col justify-start items-start min-w-0 p-2 sm:p-5 transition-all duration-700 w-12 sm:w-16 lg:w-20 h-auto lg:h-screen bg-white shadow-sm">
        <button
          onClick={handleClick}
          className="mb-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Expand sidebar"
        >
          <PanelLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="w-full flex flex-col items-center gap-2">
          <button
            onClick={() => router.push('/admin/users')}
            className="p-3 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200"
            title="All Consultants"
          >
            <Users className="h-5 w-5 text-gray-600 hover:text-blue-600 transition-colors" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden layout sm:flex sticky top-0 border flex-col justify-start items-start min-w-0 p-2 sm:p-5 transition-all duration-700 w-28 sm:w-1/5 lg:w-1/6 h-auto lg:h-screen overflow-y-auto overflow-x-visible bg-white shadow-sm z-10">
      {/* Header with title and toggle button */}
      <div className="w-full flex items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex-1 truncate">
          All Consultants
        </h2>
        <button
          onClick={handleClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          title="Collapse sidebar"
        >
          <PanelRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div className="w-full flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-green-600 animate-spin mb-2" />
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        ) : consultants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Users className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-xs text-gray-500 text-center">No consultants found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {consultants.map((consultant) => {
              const consultantId = consultant.uid || consultant.id;
              const consultantName = consultant.fullName || consultant.personalInfo?.fullName || consultant.name || 'Unknown';
              const consultantImage = consultant.profileImage || consultant.personalInfo?.profileImage;

              if (!consultantId) return null;

              return (
                <button
                  key={consultantId}
                  onClick={handleConsultantClick}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 text-left w-full"
                  title={consultantName}
                >
                  {/* Profile Image or Avatar */}
                  <div className="flex-shrink-0">
                    {consultantImage ? (
                      <Image
                        src={consultantImage}
                        alt={consultantName}
                        width={40}
                        height={40}
                        className="rounded-full w-10 h-10 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {consultantName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Name */}
                  <span className="text-sm truncate flex-1 text-gray-900">
                    {consultantName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSide;