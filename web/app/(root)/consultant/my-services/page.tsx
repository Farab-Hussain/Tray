'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { consultantAPI, consultantFlowAPI } from '@/utils/api';
import ServiceCard from '@/components/ui/ServiceCard';
import { Loader2, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Service } from '@/types';

const MyServicesPage = () => {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMyServices();
  }, []);

  useEffect(() => {
    const filtered = services.filter((service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [searchTerm, services]);

  const loadMyServices = async () => {
    try {
      setIsLoading(true);
      
      // First get consultant's UID
      const statusResponse = await consultantFlowAPI.getMyStatus();
      const statusData = statusResponse.data as { profile?: { uid: string } };
      
      if (!statusData.profile?.uid) {
        setErrorMessage('Please complete your consultant profile first.');
        setIsLoading(false);
        return;
      }

      // Get consultant's services using their UID
      const response = await consultantAPI.getConsultantServices(statusData.profile.uid);
      const myServices = (response.data as { services?: Service[] }).services || [];
      setServices(myServices);
    } catch (error: unknown) {
      console.error('Error loading services:', error);
      setErrorMessage('Failed to load your services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditService = (serviceId: string) => {
    router.push(`/consultant/my-services/edit/${serviceId}`);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await consultantAPI.deleteService(serviceId);
      setSuccessMessage('Service deleted successfully!');
      loadMyServices();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      console.error('Error deleting service:', error);
      setErrorMessage('Failed to delete service. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading your services...</p>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Services</h1>
        <p className="text-gray-600">Manage your service catalog</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search your services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          onClick={() => router.push('/consultant/applications')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Service
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Services</p>
          <p className="text-2xl font-bold text-gray-900">{services.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Active Services</p>
          <p className="text-2xl font-bold text-green-800">{services.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-blue-800">-</p>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No services match your search' : 'No services yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms.' 
              : 'Apply for existing services or create your own custom services to get started.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => router.push('/consultant/services')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Browse Services
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="relative">
              <ServiceCard
                {...service}
                isBookmarked={false}
                onBookmark={() => {}}
                onClick={() => {}}
                showApplyButton={false}
                showDeleteButton={false}
              />
              {/* Edit and Delete Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleEditService(service.id)}
                  className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                  title="Edit Service"
                >
                  <Edit className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors"
                  title="Delete Service"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyServicesPage;

