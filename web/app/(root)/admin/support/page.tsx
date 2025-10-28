'use client';

import React from 'react';
import MobileHeader from '@/components/shared/MobileHeader';
import { 
  Mail, 
  MessageSquare,
  Phone
} from 'lucide-react';

const SupportPage = () => {
  const handleEmailSupport = () => {
    window.location.href = 'mailto:support@tray.com?subject=Support Request';
  };

  return (
    <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Mobile Header */}
      <MobileHeader title="Support" />
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Support</h1>
        <p className="text-sm sm:text-base text-gray-600">Get help and contact our support team</p>
      </div>

      {/* Support Contact */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Need Help?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Our support team is here to help you. Choose your preferred way to get in touch with us.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {/* Email Support */}
            <button
              onClick={handleEmailSupport}
              className="flex flex-col items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
              <p className="text-sm text-gray-600 mb-2">support@tray.com</p>
              <p className="text-xs text-gray-500">We&apos;ll respond within 24 hours</p>
            </button>

            {/* Contact Info */}
            <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg bg-gray-50">
              <Phone className="w-8 h-8 text-gray-400 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
              <p className="text-sm text-gray-600 mb-2">Monday - Friday</p>
              <p className="text-xs text-gray-500">9:00 AM - 6:00 PM EST</p>
            </div>
          </div>

          {/* Quick Contact Form */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Contact</h3>
            <div className="max-w-md mx-auto">
              <button
                onClick={handleEmailSupport}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Send Email to Support
                      </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
