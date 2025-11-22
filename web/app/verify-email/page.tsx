'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Extract token and uid from URL (custom verification system)
        const token = searchParams.get('token');
        const uid = searchParams.get('uid');

        if (!token || !uid) {
          setStatus('error');
          setMessage('Invalid verification link. Missing token or user ID.');
          return;
        }

        try {
          // Verify email using custom token system (bypasses Firebase rate limits)
          // No authentication required - the token itself is the authentication
          console.log('Sending verification request...', { token: token?.substring(0, 10) + '...', uid });
          
          const response = await Promise.race([
            api.post<{ success?: boolean; message?: string; error?: string; code?: string }>('/auth/verify-email', {
              token: token,
              uid: uid
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout - the server did not respond within 30 seconds')), 30000)
            )
          ]) as Awaited<ReturnType<typeof api.post<{ success?: boolean; message?: string; error?: string; code?: string }>>>;

          console.log('Verification response received:', response.data);

          if (response.data?.success) {
            setStatus('success');
            setMessage('Your email has been verified successfully! Opening app...');
            
            // Auto-redirect to mobile app
            // The app will detect that email is verified when it opens
            const appDeepLink = 'tray://';
            
            // Attempt to open the app immediately
            window.location.href = appDeepLink;
            
            // Fallback: if app doesn't open, show continue button after a delay
            setTimeout(() => {
              setMessage('Your email has been verified successfully! You can now return to the Tray app and sign in.');
            }, 1500);
            
            return;
          } else {
            setStatus('error');
            setMessage(response.data?.error || 'Failed to verify email. Please try again.');
            return;
          }
        } catch (error: unknown) {
          console.error('Verification error:', error);
          
          let errorMessage = 'An error occurred while verifying your email.';
          
          if (error && typeof error === 'object' && 'response' in error) {
            const apiError = error as { response?: { data?: { error?: string; code?: string } } };
            if (apiError.response?.data?.code === 'TOKEN_EXPIRED') {
              errorMessage = 'This verification link has expired. Please request a new verification email.';
            } else if (apiError.response?.data?.code === 'INVALID_TOKEN') {
              errorMessage = 'This verification link is invalid or has already been used.';
            } else if (apiError.response?.data?.error) {
              errorMessage = apiError.response.data.error;
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          setStatus('error');
          setMessage(errorMessage);
          return;
        }
      } catch (error: unknown) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            
            <p className="text-sm text-gray-500 mt-4">You can also safely close this page.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

