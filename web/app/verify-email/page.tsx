'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { applyActionCode, reload } from 'firebase/auth';
import { auth } from '@/config/firebase';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Extract oobCode and mode from URL
        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');

        if (!auth) {
          throw new Error('Firebase auth not initialized');
        }

        // If we have oobCode and mode, Firebase hasn't processed it yet
        // This happens when user clicks the link directly
        if (mode && oobCode) {
          if (mode !== 'verifyEmail') {
            setStatus('error');
            setMessage('Invalid verification link. This link is not for email verification.');
            return;
          }

          try {
            // Apply the action code to verify the email
            await applyActionCode(auth, oobCode);
            
            // Reload the user to get updated emailVerified status
            const user = auth.currentUser;
            if (user) {
              await reload(user);
            }
            
                  setStatus('success');
                  setMessage('Email verified successfully! You can now return to the Tray mobile app and sign in.');
            return;
          } catch (error: unknown) {
            console.error('Verification error:', error);
            
            let errorMessage = 'An error occurred while verifying your email.';
            
            if (error && typeof error === 'object' && 'code' in error) {
              const firebaseError = error as { code?: string; message?: string };
              if (firebaseError.code === 'auth/expired-action-code') {
                errorMessage = 'This verification link has expired. Please request a new verification email.';
              } else if (firebaseError.code === 'auth/invalid-action-code') {
                errorMessage = 'This verification link is invalid or has already been used.';
              } else if (firebaseError.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled. Please contact support.';
              } else if (firebaseError.message) {
                errorMessage = firebaseError.message;
              }
            } else if (error instanceof Error) {
              errorMessage = error.message;
            }
            
            setStatus('error');
            setMessage(errorMessage);
            return;
          }
        }

        // If no oobCode/mode, Firebase action handler already processed the verification
        // When Firebase processes the verification link, it verifies the email on the server
        // and then redirects to continueUrl without parameters
        // In this case, we should show success since Firebase already processed it
        console.log('No oobCode/mode in URL - Firebase action handler already processed verification');
        setStatus('success');
              setMessage('Email verification link has been processed. You can now return to the Tray mobile app and sign in.');
              return;
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
                  <p className="text-sm text-gray-500">You can safely close this page.</p>
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

