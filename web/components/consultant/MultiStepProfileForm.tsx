"use client";

import React, { useState } from "react";
import { ConsultantProfileInput, CONSULTANT_CATEGORIES } from "@/types";
import {
  User,
  Briefcase,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface MultiStepProfileFormProps {
  initialData?: Partial<ConsultantProfileInput>;
  prefillData?: { uid?: string; name?: string; email?: string };
  onSubmit: (data: ConsultantProfileInput) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
}

const STEPS = [
  {
    id: 1,
    title: "Personal Information",
    description: "Tell us about yourself",
    icon: User,
  },
  {
    id: 2,
    title: "Professional Details",
    description: "Your expertise and rates",
    icon: Briefcase,
  },
];

const MultiStepProfileForm: React.FC<MultiStepProfileFormProps> = ({
  initialData,
  prefillData,
  onSubmit,
  onCancel,
  submitButtonText = "Create Profile",
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state with prefill support
  const [formData, setFormData] = useState<ConsultantProfileInput>({
    uid: initialData?.uid || prefillData?.uid || "",
    personalInfo: {
      fullName: initialData?.personalInfo?.fullName || prefillData?.name || "",
      email: initialData?.personalInfo?.email || prefillData?.email || "",
      bio: initialData?.personalInfo?.bio || "",
      experience: initialData?.personalInfo?.experience || 0,
      profileImage: initialData?.personalInfo?.profileImage || "",
      qualifications: initialData?.personalInfo?.qualifications || [],
    },
    professionalInfo: {
      title: initialData?.professionalInfo?.title || "",
      category: initialData?.professionalInfo?.category || "",
      specialties: initialData?.professionalInfo?.specialties || [],
      hourlyRate: initialData?.professionalInfo?.hourlyRate || 0,
      availability: initialData?.professionalInfo?.availability || {},
    },
  });

  // Input fields for adding specialties and qualifications
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [qualificationInput, setQualificationInput] = useState("");

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.personalInfo.fullName.trim()) {
        newErrors.fullName = "Full name is required";
      }
      if (!formData.personalInfo.email.trim()) {
        newErrors.email = "Email is required";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email)
      ) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.personalInfo.bio.trim()) {
        newErrors.bio = "Bio is required";
      } else if (formData.personalInfo.bio.length < 50) {
        newErrors.bio = "Bio must be at least 50 characters";
      }
      if (formData.personalInfo.experience < 0) {
        newErrors.experience = "Experience cannot be negative";
      }
      if (
        !formData.personalInfo.qualifications ||
        formData.personalInfo.qualifications.length === 0
      ) {
        newErrors.qualifications = "Please add at least one qualification";
      }
    }

    if (step === 2) {
      if (!formData.professionalInfo.category) {
        newErrors.category = "Please select a category";
      }
      if (
        !formData.professionalInfo.hourlyRate ||
        formData.professionalInfo.hourlyRate <= 0
      ) {
        newErrors.hourlyRate = "Please enter a valid hourly rate";
      }
      if (
        !formData.professionalInfo.specialties ||
        formData.professionalInfo.specialties.length === 0
      ) {
        newErrors.specialties = "Please add at least one specialty";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  // Add specialty
  const handleAddSpecialty = () => {
    if (
      specialtyInput.trim() &&
      !formData.professionalInfo.specialties?.includes(specialtyInput.trim())
    ) {
      setFormData({
        ...formData,
        professionalInfo: {
          ...formData.professionalInfo,
          specialties: [
            ...(formData.professionalInfo.specialties || []),
            specialtyInput.trim(),
          ],
        },
      });
      setSpecialtyInput("");
    }
  };

  // Remove specialty
  const handleRemoveSpecialty = (item: string) => {
    setFormData({
      ...formData,
      professionalInfo: {
        ...formData.professionalInfo,
        specialties:
          formData.professionalInfo.specialties?.filter((s) => s !== item) ||
          [],
      },
    });
  };

  // Add qualification
  const handleAddQualification = () => {
    if (
      qualificationInput.trim() &&
      !formData.personalInfo.qualifications?.includes(qualificationInput.trim())
    ) {
      setFormData({
        ...formData,
        personalInfo: {
          ...formData.personalInfo,
          qualifications: [
            ...(formData.personalInfo.qualifications || []),
            qualificationInput.trim(),
          ],
        },
      });
      setQualificationInput("");
    }
  };

  // Remove qualification
  const handleRemoveQualification = (item: string) => {
    setFormData({
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        qualifications:
          formData.personalInfo.qualifications?.filter((q) => q !== item) || [],
      },
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({ submit: "Failed to submit profile. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                      ${
                        isCompleted
                          ? "bg-green-600 text-white"
                          : isCurrent
                          ? "bg-green-100 text-green-700 border-2 border-green-600"
                          : "bg-gray-100 text-gray-400"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      isCurrent ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 ${
                      isCompleted ? "bg-green-600" : "bg-gray-200"
                    }`}
                    style={{ marginTop: "-2rem" }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.personalInfo.fullName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: {
                      ...formData.personalInfo,
                      fullName: e.target.value,
                    },
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: {
                      ...formData.personalInfo,
                      email: e.target.value,
                    },
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Professional Bio <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.personalInfo.bio}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: {
                      ...formData.personalInfo,
                      bio: e.target.value,
                    },
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none ${
                  errors.bio ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Tell us about your experience and what makes you a great consultant..."
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">Minimum 50 characters</p>
                <p className="text-xs text-gray-500">
                  {formData.personalInfo.bio.length} characters
                </p>
              </div>
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.personalInfo.experience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: {
                      ...formData.personalInfo,
                      experience: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.experience ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="5"
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-600">{errors.experience}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Profile Image URL (Optional)
              </label>
              <input
                type="url"
                value={formData.personalInfo.profileImage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: {
                      ...formData.personalInfo,
                      profileImage: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://example.com/your-photo.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Qualifications <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Add your qualifications and certifications (e.g.,
                Bachelor&apos;s Degree, Certified Coach)
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddQualification())
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Bachelor's Degree in Psychology, Certified Career Coach"
                />
                <button
                  type="button"
                  onClick={handleAddQualification}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.personalInfo.qualifications &&
                formData.personalInfo.qualifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.personalInfo.qualifications.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveQualification(item)}
                          className="hover:text-purple-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              {errors.qualifications && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.qualifications}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Professional Details */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Professional Title (Optional)
              </label>
              <input
                type="text"
                value={formData.professionalInfo.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    professionalInfo: {
                      ...formData.professionalInfo,
                      title: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Senior Career Consultant, Business Strategy Advisor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Consulting Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.professionalInfo.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    professionalInfo: {
                      ...formData.professionalInfo,
                      category: e.target.value,
                    },
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.category ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a category</option>
                {CONSULTANT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Hourly Rate (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.professionalInfo.hourlyRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professionalInfo: {
                        ...formData.professionalInfo,
                        hourlyRate: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.hourlyRate ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="100"
                />
              </div>
              {errors.hourlyRate && (
                <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Areas of Specialty <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Add your main areas of specialty (e.g., Career Planning, Resume
                Review)
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddSpecialty())
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Career Planning, Interview Preparation"
                />
                <button
                  type="button"
                  onClick={handleAddSpecialty}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.professionalInfo.specialties &&
                formData.professionalInfo.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.professionalInfo.specialties.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialty(item)}
                          className="hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              {errors.specialties && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.specialties}
                </p>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can configure your availability
                schedule (days and hours) after your profile is approved by the
                admin.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? "Cancel" : "Previous"}
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {submitButtonText}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiStepProfileForm;
