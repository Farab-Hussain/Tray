"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ServiceCard from "@/components/ui/ServiceCard";
import ServicesTop from "@/components/ui/ServicesTop";
import ServicesStepIndicator from "@/components/consultant/ServicesStepIndicator";
import Button from "@/components/custom/Button";
import { Plus, Search, FileText, Loader2 } from "lucide-react";
import { Service, BackendApplication } from "@/types";
import { consultantAPI, consultantFlowAPI } from "@/utils/api";

const ServicesPage = () => {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "applied" | "bookmarked">("all");
  const [bookmarkedServices, setBookmarkedServices] = useState<Set<string>>(new Set());
  const [appliedServices, setAppliedServices] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userUid, setUserUid] = useState<string | null>(null);

  // Load services and user applications
  useEffect(() => {
    loadServicesAndApplications();
  }, []);

  const loadServicesAndApplications = async () => {
    try {
      setIsLoading(true);
      
      // Get default services
      const servicesResponse = await consultantAPI.getDefaultServices();
      setServices((servicesResponse.data as { services: Service[] }).services);

      // Get user status to get uid
      const statusResponse = await consultantFlowAPI.getMyStatus();
      const statusData = statusResponse.data as { profile?: { uid: string }; status?: string };
      if (statusData.profile?.uid) {
        setUserUid(statusData.profile.uid);
        
        // Get user's applications (only pending ones should show as "applied")
        const appsResponse = await consultantFlowAPI.getMyApplications();
        const pendingApplicationServiceIds = ((appsResponse.data as { applications: BackendApplication[] }).applications)
          .filter((app: BackendApplication) => app.status === 'pending') // Only pending applications
          .map((app: BackendApplication) => app.serviceId)
          .filter(Boolean);
        setAppliedServices(new Set(pendingApplicationServiceIds as string[]));
        
        // Check current onboarding step
        if (statusData.status === 'approved') {
          setCurrentStep(3);
        } else if (statusData.status === 'pending') {
          setCurrentStep(2);
        }
      }
    } catch (error: unknown) {
      console.error('Error loading services:', error);
      setErrorMessage('Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToService = async (serviceId: string) => {
    if (!userUid) {
      setErrorMessage('Please complete your profile first.');
      return;
    }

    try {
      setErrorMessage(null);
      setCurrentStep(2);
      
      // Submit application for existing service
      await consultantFlowAPI.createApplication({
        consultantId: userUid,
        type: 'existing',
        serviceId: serviceId,
      });
      
      setAppliedServices((prev) => new Set([...prev, serviceId]));
      setSuccessMessage("Application submitted successfully! Awaiting admin approval.");
      setCurrentStep(3);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: unknown) {
      console.error('Error applying to service:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { error?: string } })?.data?.error 
        : undefined;
      setErrorMessage(errorMessage || 'Failed to submit application. Please try again.');
      setCurrentStep(1);
    }
  };

  const handleBookmark = (id: string) => {
    setBookmarkedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleServiceClick = (id: string) => {
    const service = services.find((s) => s.id === id);
    if (service) {
      console.log(`Clicked on service: ${service.title}`);
    }
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === "available") return !appliedServices.has(service.id);
    if (filterStatus === "applied") return appliedServices.has(service.id);
    if (filterStatus === "bookmarked") return bookmarkedServices.has(service.id);
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <ServicesTop />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ServicesTop />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <ServicesStepIndicator currentStep={currentStep} className="sticky top-6" />
        </div>

        <div className="lg:col-span-9">
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Services</option>
              <option value="available">Available</option>
              <option value="applied">Applied</option>
              <option value="bookmarked">Bookmarked</option>
            </select>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              Available Services ({filteredServices.length})
            </h1>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={FileText}
                onClick={() => router.push("/consultant/my-services")}
              >
                My Services
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={FileText}
                onClick={() => router.push("/consultant/applications")}
              >
                My Applications
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => router.push("/consultant/applications")}
              >
                Create Service
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                {...service}
                isBookmarked={bookmarkedServices.has(service.id)}
                onBookmark={handleBookmark}
                onClick={handleServiceClick}
                showApplyButton={true}
                showDeleteButton={false}
                isApplied={appliedServices.has(service.id)}
                onApply={handleApplyToService}
              />
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
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
                {searchTerm ? "No services match your search" : "No services available"}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search terms." : "Check back later for new service opportunities."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
