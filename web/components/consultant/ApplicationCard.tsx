import React from 'react';
import { ConsultantApplication } from '@/types';
import ProfileStatusBadge from './ProfileStatusBadge';
import { FileText, Clock, DollarSign, Calendar } from 'lucide-react';
import { formatDate } from '@/utils';

interface ApplicationCardProps {
  application: ConsultantApplication;
  onView?: () => void;
  onDelete?: () => void;
  className?: string;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ 
  application, 
  onView, 
  onDelete,
  className = '' 
}) => {
  const serviceTitle = application.type === 'new' 
    ? application.customService?.title 
    : 'Service Application';

  const servicePrice = application.type === 'new' 
    ? application.customService?.price 
    : null;

  const serviceDuration = application.type === 'new' 
    ? application.customService?.duration 
    : null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{serviceTitle}</h3>
            <p className="text-xs text-gray-500">
              {application.type === 'new' ? 'New Service' : 'Existing Service'}
            </p>
          </div>
        </div>
        <ProfileStatusBadge status={application.status} />
      </div>

      {/* Description */}
      {application.type === 'new' && application.customService?.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {application.customService.description}
        </p>
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {servicePrice !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span>${servicePrice}</span>
          </div>
        )}
        {serviceDuration !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{serviceDuration} mins</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>
            {application.submittedAt ? formatDate(application.submittedAt) : 'Recently'}
          </span>
        </div>
      </div>

      {/* Review Notes */}
      {application.reviewNotes && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-1">Review Notes:</p>
          <p className="text-sm text-gray-600">{application.reviewNotes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {onView && (
          <button
            onClick={onView}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            View Details
          </button>
        )}
        {onDelete && application.status === 'pending' && (
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default ApplicationCard;

