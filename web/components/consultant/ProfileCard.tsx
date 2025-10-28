import React from 'react';
import { ConsultantProfile } from '@/types';
import ProfileStatusBadge from './ProfileStatusBadge';
import { Mail, Briefcase, DollarSign, Calendar } from 'lucide-react';
import { formatDate } from '@/utils';
import Image from 'next/image';

interface ProfileCardProps {
  profile: ConsultantProfile;
  onEdit?: () => void;
  className?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onEdit, className = '' }) => {
  console.log('ProfileCard rendering with profile:', profile);
  console.log('createdAt value:', profile.createdAt, 'Type:', typeof profile.createdAt);
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {profile.personalInfo?.profileImage ? (
            <Image
              src={profile.personalInfo.profileImage}
              alt={profile.personalInfo?.fullName || 'Profile'}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile.personalInfo?.fullName?.charAt(0) || 'C'}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {profile.personalInfo?.fullName || 'Consultant'}
            </h3>
            <p className="text-sm text-gray-600">
              {profile.professionalInfo?.category || 'Consultant'}
            </p>
          </div>
        </div>
        <ProfileStatusBadge status={profile.status} />
      </div>

      {/* Bio */}
      {profile.personalInfo?.bio && (
        <p className="text-gray-700 mb-4 line-clamp-2">{profile.personalInfo.bio}</p>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate">{profile.personalInfo?.email || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <span>{profile.personalInfo?.experience || 0} years experience</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span>${profile.professionalInfo?.hourlyRate || 0}/hour</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>
            {profile.createdAt ? formatDate(profile.createdAt) : 'Recently'}
          </span>
        </div>
      </div>

      {/* Expertise & Certifications */}
      <div className="space-y-3 mb-4">
        {profile.professionalInfo?.specialties && profile.professionalInfo.specialties.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Areas of Expertise:</p>
            <div className="flex flex-wrap gap-2">
              {profile.professionalInfo.specialties.map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {profile.personalInfo?.qualifications && profile.personalInfo.qualifications.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Qualifications:</p>
            <div className="flex flex-wrap gap-2">
              {profile.personalInfo.qualifications.map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Button */}
      {onEdit && profile.status !== 'approved' && (
        <button
          onClick={onEdit}
          className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Edit Profile
        </button>
      )}
    </div>
  );
};

export default ProfileCard;

