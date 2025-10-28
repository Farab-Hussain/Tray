'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { consultantAPI, consultantFlowAPI } from '@/utils/api';
import { Loader2, Save, X, Clock } from 'lucide-react';

interface AvailabilitySchedule {
  days: string[];
  startTime: string;
  endTime: string;
  timezone: string;
}

interface ServiceFormData {
  title: string;
  description: string;
  duration: number;
  price: number;
  hourlyRate?: number;
  availability?: AvailabilitySchedule;
  imageUrl?: string;
}

interface ServiceFromAPI {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  price?: number;
  availability?: string | AvailabilitySchedule;
  imageUrl?: string;
}

const EditServicePage = () => {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    duration: 60,
    price: 100,
    hourlyRate: 100,
    availability: {
      days: [],
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'EST'
    },
    imageUrl: ''
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timezones = ['EST', 'CST', 'MST', 'PST', 'GMT', 'UTC'];
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadService();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const loadService = async () => {
    try {
      setIsLoading(true);
      
      // Get consultant's UID
      const statusResponse = await consultantFlowAPI.getMyStatus();
      const statusData = statusResponse.data as { profile?: { uid: string } };
      
      if (!statusData.profile?.uid) {
        setErrorMessage('Please complete your consultant profile first.');
        return;
      }

      // Get consultant's services
      const response = await consultantAPI.getConsultantServices(statusData.profile.uid);
      const services = (response.data as { 
        services?: { 
          id: string; 
          title?: string; 
          description?: string; 
          duration?: number; 
          price?: number; 
          availability?: string | AvailabilitySchedule;
        }[] 
      }).services || [];
      
      // Find the specific service
      const service = services.find((s) => s.id === serviceId) as ServiceFromAPI;
      
      if (!service) {
        setErrorMessage('Service not found.');
        return;
      }

      // Handle availability - convert string to object if needed
      let availabilityData: AvailabilitySchedule = {
        days: [],
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'EST'
      };

      if (service.availability) {
        if (typeof service.availability === 'string') {
          // If it's a string (old format), use default values
          availabilityData = {
            days: [],
            startTime: '09:00',
            endTime: '17:00',
            timezone: 'EST'
          };
        } else {
          // If it's already an object, use it
          availabilityData = service.availability;
        }
      }

      setFormData({
        title: service.title || '',
        description: service.description || '',
        duration: service.duration || 60,
        price: service.price || 100,
        hourlyRate: service.price || 100, // Using price as hourly rate
        availability: availabilityData,
        imageUrl: service.imageUrl || ''
      });
    } catch (error: unknown) {
      console.error('Error loading service:', error);
      setErrorMessage('Failed to load service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await consultantAPI.updateService(serviceId, {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        price: formData.hourlyRate || formData.price,
        availability: formData.availability,
        imageUrl: formData.imageUrl
      });

      router.push('/consultant/my-services');
    } catch (error: unknown) {
      console.error('Error updating service:', error);
      setErrorMessage('Failed to update service. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading service...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Service</h1>
        <p className="text-gray-600">Update your service details</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* Service Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Service Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Career Coaching Session"
          />
        </div>

        {/* Service Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Describe your service in detail..."
          />
        </div>

        {/* Duration and Hourly Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              id="duration"
              required
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate ($) *
            </label>
            <input
              type="number"
              id="hourlyRate"
              required
              min="1"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Your hourly rate for this service</p>
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Service Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="https://example.com/service-image.jpg"
          />
          {formData.imageUrl && (
            <div className="mt-2">
              <Image 
                src={formData.imageUrl} 
                alt="Service Preview" 
                width={300}
                height={200}
                className="max-w-xs h-auto rounded-md border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Availability Schedule */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-gray-700" />
            <label className="text-sm font-medium text-gray-700">
              Set Your Availability
            </label>
          </div>

          {/* Days of Week */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Select Available Days</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {daysOfWeek.map((day) => (
                <label
                  key={day}
                  className={`flex items-center justify-center px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                    formData.availability?.days.includes(day)
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.availability?.days.includes(day)}
                    onChange={(e) => {
                      const currentDays = formData.availability?.days || [];
                      const newDays = e.target.checked
                        ? [...currentDays, day]
                        : currentDays.filter((d) => d !== day);
                      setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability!,
                          days: newDays
                        }
                      });
                    }}
                  />
                  <span className="text-sm font-medium">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                value={formData.availability?.startTime || '09:00'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availability: {
                      ...formData.availability!,
                      startTime: e.target.value
                    }
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                value={formData.availability?.endTime || '17:00'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availability: {
                      ...formData.availability!,
                      endTime: e.target.value
                    }
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              id="timezone"
              value={formData.availability?.timezone || 'EST'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  availability: {
                    ...formData.availability!,
                    timezone: e.target.value
                  }
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {formData.availability?.days && formData.availability.days.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Your Availability:</span>{' '}
                {formData.availability.days.join(', ')} from{' '}
                {formData.availability.startTime} to {formData.availability.endTime}{' '}
                {formData.availability.timezone}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/consultant/my-services')}
            disabled={isSaving}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditServicePage;

