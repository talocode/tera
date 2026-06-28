'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CodraAuthSuccess() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const deviceCode = searchParams.get('device_code');
    
    if (!deviceCode) {
      setStatus('error');
      setErrorMessage('Missing device code');
      return;
    }

    // Approve the device session
    const approveDevice = async () => {
      try {
        const response = await fetch('/api/codra/auth/device/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_code: deviceCode })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setEmail(data.email || null);
        } else if (response.status === 401) {
          // User not signed in, redirect to sign in
          window.location.href = `/auth/signin?source=codra-code&device_code=${deviceCode}&redirect_to=${encodeURIComponent('/codra-code/auth/success?device_code=' + deviceCode)}`;
          return;
        } else if (response.status === 410) {
          setStatus('expired');
          setErrorMessage('Device code has expired. Please try again.');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to approve device');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('Network error. Please try again.');
      }
    };

    approveDevice();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Codra Code Authenticated
          </h1>
          
          {status === 'loading' && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Authenticating with Tera...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mt-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-gray-600">
                You are authenticated with Tera. You can return to your terminal.
              </p>
              {email && (
                <p className="mt-2 text-sm text-gray-500">
                  Signed in as: {email}
                </p>
              )}
              <div className="mt-6 space-y-2">
                <p className="text-sm text-gray-500">
                  Run <code className="bg-gray-100 px-2 py-1 rounded">codra-code auth status</code> to verify.
                </p>
                <Link 
                  href="/"
                  className="inline-block text-blue-600 hover:text-blue-800"
                >
                  Return to Tera Dashboard
                </Link>
              </div>
            </div>
          )}
          
          {status === 'expired' && (
            <div className="mt-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mt-4 text-gray-600">
                {errorMessage || 'Device code has expired.'}
              </p>
              <div className="mt-6">
                <Link 
                  href="/auth/signin"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Try Again
                </Link>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mt-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-gray-600">
                {errorMessage || 'Authentication failed. Please try again.'}
              </p>
              <div className="mt-6">
                <Link 
                  href="/auth/signin"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Sign In Again
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
